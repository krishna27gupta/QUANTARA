"""
test_historical_analogs.py

Tests for the leakage-safe historical analog engine.

Tests verify:
  1. No analog date is on or after the as_of_date.
  2. Standardization statistics differ when computed as-of different dates
     (proving they are refit, not cached/global).
  3. Forward returns are correctly sourced from raw Close data.
  4. The bootstrap CI function handles edge cases.
"""
import os
import sys
import numpy as np
import pandas as pd
try:
    import pytest
except ImportError:
    pytest = None

# Ensure ml/src is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from historical_analogs import (
    find_analogs,
    bootstrap_return_ci,
    ANALOG_FEATURES,
    FORWARD_DAYS,
)


def _make_test_df(n_rows=500, seed=42):
    """Create a synthetic DataFrame that mimics real engineered features."""
    rng = np.random.RandomState(seed)
    dates = pd.bdate_range("2020-01-01", periods=n_rows, freq="B")
    close = 100 + np.cumsum(rng.randn(n_rows) * 0.5)
    high = close + rng.uniform(0.5, 2, n_rows)
    low = close - rng.uniform(0.5, 2, n_rows)

    df = pd.DataFrame({
        "Open": close + rng.randn(n_rows) * 0.1,
        "High": high,
        "Low": low,
        "Close": close,
        "Volume": rng.randint(100000, 10000000, n_rows).astype(float),
        "rsi": rng.uniform(20, 80, n_rows),
        "macd_hist": rng.randn(n_rows) * 2,
        "atr_percentile": rng.uniform(0, 1, n_rows),
        "relative_volume": rng.uniform(0.5, 3, n_rows),
        "trend_persistence_5d": rng.randn(n_rows) * 0.5,
        "historical_volatility": rng.uniform(0.1, 0.6, n_rows),
        "drawdown_percentile": rng.uniform(0, 1, n_rows),
        "adx": rng.uniform(10, 50, n_rows),
    }, index=dates)
    return df


class TestNoLeakage:
    """Tests that the analog search never looks into the future."""

    def test_analog_dates_strictly_before_as_of(self):
        """No analog should have a date on or after the as_of_date."""
        df = _make_test_df(500)
        as_of = df.index[300]  # Some date in the middle

        result = find_analogs(df, as_of, k=15)

        assert "error" not in result, f"Unexpected error: {result.get('error')}"
        assert len(result["analogs"]) > 0, "No analogs found"

        for analog in result["analogs"]:
            analog_date = pd.Timestamp(analog["date"])
            # Analog date must be strictly before as_of_date (minus gap)
            assert analog_date < as_of, (
                f"LEAKAGE: analog date {analog_date} is not before as_of {as_of}"
            )

    def test_analog_dates_respect_gap(self):
        """Analog dates must be before (as_of_date - FORWARD_DAYS) to allow
        full forward return realization."""
        df = _make_test_df(500)
        as_of = df.index[300]
        cutoff = as_of - pd.Timedelta(days=FORWARD_DAYS)

        result = find_analogs(df, as_of, k=15)

        for analog in result["analogs"]:
            analog_date = pd.Timestamp(analog["date"])
            assert analog_date < cutoff, (
                f"LEAKAGE: analog date {analog_date} is not before cutoff {cutoff}. "
                f"Forward returns may not be fully realized."
            )

    def test_standardization_differs_for_different_dates(self):
        """Standardization stats must be recomputed as-of each date —
        proving they don't use global/cached statistics."""
        df = _make_test_df(500)

        date_early = df.index[150]
        date_late = df.index[400]

        result_early = find_analogs(df, date_early, k=10)
        result_late = find_analogs(df, date_late, k=10)

        stats_early = result_early["summary"]["standardization_stats"]
        stats_late = result_late["summary"]["standardization_stats"]

        # The number of rows used must differ (expanding window)
        assert stats_early["n_rows_used_for_stats"] < stats_late["n_rows_used_for_stats"], (
            f"History size should grow: early={stats_early['n_rows_used_for_stats']}, "
            f"late={stats_late['n_rows_used_for_stats']}"
        )

        # At least some feature means should differ
        means_early = stats_early["feature_means"]
        means_late = stats_late["feature_means"]
        any_differ = any(
            abs(means_early[f] - means_late[f]) > 1e-6
            for f in means_early
        )
        assert any_differ, (
            "Standardization means are identical for different dates — "
            "this suggests global stats are being used (leakage bug)"
        )

    def test_history_end_date_before_as_of(self):
        """The history window used for standardization must end before as_of_date."""
        df = _make_test_df(500)
        as_of = df.index[300]

        result = find_analogs(df, as_of, k=15)
        history_end = pd.Timestamp(result["summary"]["standardization_stats"]["history_end_date"])

        assert history_end < as_of, (
            f"LEAKAGE: history_end_date {history_end} is not before as_of {as_of}"
        )


class TestForwardReturns:
    """Tests that forward returns are correctly computed."""

    def test_forward_returns_match_raw_close(self):
        """Forward returns should match manual calculation from Close prices."""
        df = _make_test_df(500)
        as_of = df.index[300]

        result = find_analogs(df, as_of, k=5)

        for analog in result["analogs"]:
            adate = pd.Timestamp(analog["date"])
            if analog["forward_return_5d_pct"] is not None:
                # Manually compute expected return
                close_at = df.loc[adate, "Close"]
                future_dates = df.index[df.index > adate][:FORWARD_DAYS]
                if len(future_dates) == FORWARD_DAYS:
                    close_future = df.loc[future_dates[-1], "Close"]
                    expected_return = (close_future - close_at) / close_at * 100
                    assert abs(analog["forward_return_5d_pct"] - expected_return) < 0.1, (
                        f"Return mismatch at {adate}: got {analog['forward_return_5d_pct']}, "
                        f"expected {expected_return:.2f}"
                    )


class TestBootstrapCI:
    """Tests for the bootstrap confidence interval function."""

    def test_empty_returns(self):
        """Should handle empty array gracefully."""
        result = bootstrap_return_ci(np.array([]))
        assert result["n_analogs"] == 0
        assert result["median_return_pct"] is None

    def test_single_return(self):
        """Should handle a single return value."""
        result = bootstrap_return_ci(np.array([5.0]))
        assert result["n_analogs"] == 1
        assert result["median_return_pct"] == 5.0

    def test_ci_bounds_order(self):
        """Lower bound should be <= median <= upper bound."""
        returns = np.random.randn(15) * 2
        result = bootstrap_return_ci(returns)
        assert result["ci_lower_median"] <= result["median_return_pct"]
        assert result["median_return_pct"] <= result["ci_upper_median"]

    def test_hit_rate_bounds(self):
        """Hit rate should be between 0 and 100."""
        returns = np.random.randn(15) * 2
        result = bootstrap_return_ci(returns)
        assert 0 <= result["hit_rate_pct"] <= 100
        assert 0 <= result["ci_lower_hit_rate"] <= 100
        assert 0 <= result["ci_upper_hit_rate"] <= 100

    def test_caveat_mentions_small_sample(self):
        """Small samples should produce a caveat about confidence intervals."""
        returns = np.random.randn(10) * 2
        result = bootstrap_return_ci(returns)
        assert "descriptive statistic" in result["caveat"].lower()


class TestEdgeCases:
    """Tests for edge cases."""

    def test_as_of_date_too_early(self):
        """Should return error when there isn't enough history."""
        df = _make_test_df(500)
        as_of = df.index[5]  # Very early — not enough history for k=15

        result = find_analogs(df, as_of, k=15)
        assert "error" in result

    def test_k_larger_than_history(self):
        """Should return fewer analogs when k > available history."""
        df = _make_test_df(50)
        as_of = df.index[30]

        result = find_analogs(df, as_of, k=100)
        # Should still work, just return fewer
        if "error" not in result:
            assert len(result["analogs"]) <= 100


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
