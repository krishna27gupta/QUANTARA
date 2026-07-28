"""
test_explainability.py

Unit tests for the ExplainabilityEngine, verifying that the SHAP-based
rationale generation works correctly with the binary XGBoost trend model.
"""
import sys
import os

# Ensure ml/src is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

import pytest


def test_shap_rationales_are_real_not_placeholder():
    """
    ExplainabilityEngine.generate_rationales() must return real, non-placeholder
    rationale strings — NOT the 'Insufficient feature data' fallback.

    This validates the fix for the binary-model SHAP shape mismatch that was
    silently producing empty SHAP values and falling through to the fallback.
    """
    from explainability import ExplainabilityEngine

    engine = ExplainabilityEngine()

    # Verify the engine loaded the model and SHAP explainer successfully
    assert engine.xgb_model is not None, "XGBoost model failed to load"
    assert engine.explainer is not None, "SHAP TreeExplainer failed to initialize"
    assert len(engine.features) > 0, "Feature list is empty"

    rationales = engine.generate_rationales("RELIANCE", signal="BUY", top_n=4)

    # Must return a non-empty list
    assert isinstance(rationales, list), f"Expected list, got {type(rationales)}"
    assert len(rationales) > 0, "Rationales list is empty"

    # None of the rationales should be the placeholder/fallback message
    FALLBACK_MARKER = "Insufficient feature data"
    for r in rationales:
        assert isinstance(r, str), f"Rationale is not a string: {r}"
        assert len(r) > 10, f"Rationale is suspiciously short: {r}"
        assert FALLBACK_MARKER not in r, (
            f"Got fallback placeholder instead of real rationale: {r}"
        )


def test_shap_rationales_vary_across_symbols():
    """
    Different symbols should generally produce different SHAP attributions
    (and therefore different rationale text), confirming the engine is
    actually computing per-symbol explanations — not returning cached or
    hardcoded output.
    """
    from explainability import ExplainabilityEngine

    engine = ExplainabilityEngine()

    rationales_1 = engine.generate_rationales("RELIANCE", signal="BUY", top_n=4)
    rationales_2 = engine.generate_rationales("TCS", signal="BUY", top_n=4)

    # Both should be real (non-empty, non-placeholder)
    FALLBACK_MARKER = "Insufficient feature data"
    for symbol, rats in [("RELIANCE", rationales_1), ("TCS", rationales_2)]:
        assert len(rats) > 0, f"No rationales for {symbol}"
        for r in rats:
            assert FALLBACK_MARKER not in r, (
                f"Got fallback for {symbol}: {r}"
            )

    # They should not be identical (different stocks have different features)
    # Note: this could theoretically fail if two stocks happen to have
    # exactly the same top-4 feature attributions, but in practice that's
    # extremely unlikely.
    assert rationales_1 != rationales_2, (
        "Rationales for RELIANCE and TCS are identical — SHAP may not be "
        "computing per-symbol values"
    )


def test_calculate_shap_values_returns_dict():
    """
    calculate_shap_values() should return a non-empty dict of
    {feature_name: float} values for the binary model.
    """
    from explainability import ExplainabilityEngine

    engine = ExplainabilityEngine()
    shap_vals = engine.calculate_shap_values("RELIANCE")

    assert isinstance(shap_vals, dict), f"Expected dict, got {type(shap_vals)}"
    assert len(shap_vals) > 0, "SHAP values dict is empty — extraction may be broken"

    for name, val in shap_vals.items():
        assert isinstance(name, str), f"Feature name is not a string: {name}"
        assert isinstance(val, float), f"SHAP value is not a float: {val}"
        assert abs(val) >= 1e-4, f"SHAP value below threshold should have been filtered: {val}"
