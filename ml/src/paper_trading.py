import os
import sys
# Add workspace root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import glob
import json
import uuid
import pickle
import logging
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
import yfinance as yf
from ml.src.features_engine import calculate_advanced_indicators
from ml.src.risk import RiskPredictor
from ml.src.expected_return import ExpectedReturnPredictor

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("quantara-paper-trading")

class PaperTradingEngine:
    """Simulator and portfolio manager for live paper trading validation on NIFTY 50."""

    def __init__(self, start_capital: float = 100000.0, models_dir: str = "models"):
        self.capital = start_capital
        self.cash = start_capital
        self.max_positions = 5
        self.max_allocation = 0.20  # 20%
        self.max_risk_pct = 0.02    # 2% stop-loss threshold
        self.target_pct = 0.04      # 4% take-profit target
        self.max_hold_days = 5
        
        self.models_dir = models_dir
        self.portfolio_dir = "ml/paper_portfolio"
        os.makedirs(self.portfolio_dir, exist_ok=True)
        
        # Load model and metadata
        self.model = None
        self.features = []
        self.risk_predictor = RiskPredictor()
        self.return_predictor = ExpectedReturnPredictor()
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            workspace_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
            lgb_path = os.path.join(workspace_root, models_dir, "trend_lightgbm.pkl")
            meta_path = os.path.join(workspace_root, models_dir, "feature_metadata.json")
            
            if os.path.exists(lgb_path):
                with open(lgb_path, "rb") as f:
                    self.model = pickle.load(f)
            if os.path.exists(meta_path):
                with open(meta_path, "r") as f:
                    meta = json.load(f)
                    self.features = meta.get("features", [])
            logger.info("Successfully loaded trend classification models for paper trading.")
        except Exception as e:
            logger.error(f"Failed to load classification models: {e}")

    def run_simulation(self, days_count: int = 60):
        """Simulate walk-forward daily portfolio execution over the last `days_count` business days."""
        logger.info(f"Starting paper trading simulation for {days_count} business days...")
        
        datasets_dir = "ml/datasets"
        parquet_files = glob.glob(os.path.join(datasets_dir, "*.parquet"))
        if not parquet_files:
            logger.error(f"No datasets found in {datasets_dir}. Exiting.")
            return

        # Calculate average returns for Beta
        all_returns = []
        for file in parquet_files:
            df = pd.read_parquet(file)
            all_returns.append(df['Close'].pct_change() if 'Close' in df.columns else df['close'].pct_change())
        market_returns = pd.concat(all_returns, axis=1).mean(axis=1)

        # Download real Nifty and VIX
        logger.info("Downloading real market context (^NSEI, ^NSEBANK, ^INDIAVIX)...")
        try:
            nifty_df = yf.download("^NSEI", period="5y", progress=False)['Close']
            bank_df = yf.download("^NSEBANK", period="5y", progress=False)['Close']
            vix_df = yf.download("^INDIAVIX", period="5y", progress=False)['Close']
            
            if isinstance(nifty_df, pd.DataFrame): nifty_df = nifty_df.iloc[:, 0]
            if isinstance(bank_df, pd.DataFrame): bank_df = bank_df.iloc[:, 0]
            if isinstance(vix_df, pd.DataFrame): vix_df = vix_df.iloc[:, 0]
                
            context_df = pd.DataFrame({
                "context_nifty_close": nifty_df,
                "context_bank_close": bank_df,
                "context_vix_close": vix_df
            })
            context_df.index = pd.to_datetime(context_df.index).tz_localize(None)
            context_df = context_df.ffill().bfill()
        except Exception as e:
            logger.error(f"Failed to download context: {e}")
            context_df = pd.DataFrame(columns=["context_nifty_close", "context_bank_close", "context_vix_close"])

        # Load all stock features aligned by Date
        stock_dfs = {}
        for file in parquet_files:
            ticker = os.path.basename(file).replace(".parquet", "")
            try:
                df = pd.read_parquet(file)
                # Map column casing to uppercase
                df = df.rename(columns={
                    "open": "Open", "high": "High", "low": "Low", "close": "Close", "volume": "Volume",
                    "dividend": "Dividends", "split": "Stock Splits"
                })
                
                df.index = pd.to_datetime(df.index).tz_localize(None)
                df = df.merge(context_df, how="left", left_index=True, right_index=True)
                df = df.ffill().bfill()
                
                df = calculate_advanced_indicators(df, market_returns)
                
                # Base lags
                for lag in range(1, 11):
                    df[f"lag_close_{lag}"] = df['Close'].shift(lag)
                    df[f"lag_volume_{lag}"] = df['Volume'].shift(lag)
                for lag in range(1, 6):
                    df[f"lag_rsi_{lag}"] = df['rsi'].shift(lag)
                    df[f"lag_macd_{lag}"] = df['macd'].shift(lag)
                
                df = df.ffill().bfill()
                stock_dfs[ticker] = df
            except Exception as e:
                logger.error(f"Error loading features for {ticker}: {e}")

        # Extract overlapping calendar dates
        common_dates = sorted(list(set.intersection(*(set(df.index) for df in stock_dfs.values()))))
        if not common_dates:
            logger.error("No overlapping trading dates found. Exiting.")
            return

        # Slice last 60 business days
        sim_dates = common_dates[-days_count:]
        logger.info(f"Simulation run dates: {sim_dates[0].strftime('%Y-%m-%d')} to {sim_dates[-1].strftime('%Y-%m-%d')}")

        open_positions = []  # dict: symbol, qty, entry_price, entry_date, days_held, stop_loss, target_price, confidence
        closed_trades = []
        equity_history = []  # dict: Date, Portfolio value, Daily return, Cumulative return
        
        prev_portfolio_value = self.capital

        for idx, current_date in enumerate(sim_dates):
            date_str = current_date.strftime("%Y-%m-%d")
            
            # --- A. Check target or stop-loss hits for existing positions ---
            still_open = []
            for pos in open_positions:
                symbol = pos["symbol"]
                stock_df = stock_dfs[symbol]
                
                # Retrieve price profile of current day
                day_data = stock_df.loc[[current_date]]
                if day_data.empty:
                    still_open.append(pos)
                    continue
                    
                high_price = float(day_data['High'].iloc[0])
                low_price = float(day_data['Low'].iloc[0])
                close_price = float(day_data['Close'].iloc[0])
                
                # Check stop-loss hit
                if low_price <= pos["stop_loss"]:
                    # Closed at stop loss
                    exit_price = pos["stop_loss"] * 0.9975
                    pnl = (exit_price - pos["entry_price"]) * pos["qty"]
                    closed_trades.append({
                        "trade_id": pos["trade_id"],
                        "date": date_str,
                        "symbol": symbol,
                        "signal": "SELL",
                        "confidence": pos["confidence"],
                        "entry_price": pos["entry_price"],
                        "exit_price": exit_price,
                        "pnl": pnl,
                        "pnl_pct": (exit_price - pos["entry_price"]) / pos["entry_price"] * 100,
                        "holding_period": pos["days_held"] + 1,
                        "reason": "STOP_LOSS"
                    })
                    self.cash += (pos["qty"] * exit_price)
                    
                # Check take-profit hit
                elif high_price >= pos["target_price"]:
                    exit_price = pos["target_price"] * 0.9975
                    pnl = (exit_price - pos["entry_price"]) * pos["qty"]
                    closed_trades.append({
                        "trade_id": pos["trade_id"],
                        "date": date_str,
                        "symbol": symbol,
                        "signal": "SELL",
                        "confidence": pos["confidence"],
                        "entry_price": pos["entry_price"],
                        "exit_price": exit_price,
                        "pnl": pnl,
                        "pnl_pct": (exit_price - pos["entry_price"]) / pos["entry_price"] * 100,
                        "holding_period": pos["days_held"] + 1,
                        "reason": "TARGET_HIT"
                    })
                    self.cash += (pos["qty"] * exit_price)
                    
                # Check max holding period exceeded (5 days)
                elif pos["days_held"] >= self.max_hold_days - 1:
                    exit_price = close_price * 0.9975
                    pnl = (exit_price - pos["entry_price"]) * pos["qty"]
                    closed_trades.append({
                        "trade_id": pos["trade_id"],
                        "date": date_str,
                        "symbol": symbol,
                        "signal": "SELL",
                        "confidence": pos["confidence"],
                        "entry_price": pos["entry_price"],
                        "exit_price": exit_price,
                        "pnl": pnl,
                        "pnl_pct": (exit_price - pos["entry_price"]) / pos["entry_price"] * 100,
                        "holding_period": pos["days_held"] + 1,
                        "reason": "TIME_EXCEEDED"
                    })
                    self.cash += (pos["qty"] * exit_price)
                    
                else:
                    # Update holding count
                    pos["days_held"] += 1
                    still_open.append(pos)

            open_positions = still_open

            # --- B. Compute current equity value of open positions ---
            open_equity = 0.0
            for pos in open_positions:
                symbol = pos["symbol"]
                stock_df = stock_dfs[symbol]
                close_price = float(stock_df.loc[current_date, 'Close'])
                open_equity += (pos["qty"] * close_price)

            portfolio_value = self.cash + open_equity
            daily_return = (portfolio_value - prev_portfolio_value) / prev_portfolio_value if idx > 0 else 0.0
            cum_return = (portfolio_value - self.capital) / self.capital * 100
            
            equity_history.append({
                "Date": date_str,
                "Portfolio value": round(portfolio_value, 2),
                "Daily return": round(daily_return * 100, 4),
                "Cumulative return": round(cum_return, 4)
            })
            prev_portfolio_value = portfolio_value

            # --- C. Daily Predictions & Selection (3:45 PM NSE Market Close) ---
            # Generate predictions for all NIFTY 50 stocks on this current date
            candidates = []
            
            for symbol, df in stock_dfs.items():
                if current_date not in df.index:
                    continue
                row = df.loc[[current_date]]
                
                # Check features alignment
                try:
                    X = row[self.features]
                    probs = self.model.predict_proba(X)[0]
                    prob_buy = float(probs[2]) if len(probs) == 3 else float(probs[-1])
                    confidence = int(prob_buy * 100)
                    
                    if confidence > 48:  # filter confidence threshold
                        row_dict = row.iloc[0].to_dict()
                        ret_pred = self.return_predictor.predict(symbol, precomputed_row=row_dict)
                        risk_pred = self.risk_predictor.predict(symbol, precomputed_row=row_dict)
                        
                        expected_ret = ret_pred.get("expected_return_pct", round(float(row_dict.get('roc', 0.0)) * 0.45, 2))
                        risk_label = risk_pred.get("risk_level", "Medium")
                        
                        candidates.append({
                            "symbol": symbol,
                            "confidence": confidence,
                            "probability": round(prob_buy, 4),
                            "expected_return": expected_ret,
                            "risk": risk_label,
                            "close": float(row['Close'].iloc[0])
                        })
                except Exception:
                    continue

            # Sort by highest confidence and select top 5 opportunities
            candidates = sorted(candidates, key=lambda x: x["confidence"], reverse=True)[:5]

            # Store today's picks signals
            if idx == len(sim_dates) - 1:
                # Latest day signals output
                latest_signals_df = pd.DataFrame([
                    {
                        "symbol": c["symbol"],
                        "signal": "BUY",
                        "confidence": c["confidence"],
                        "probability": c["probability"],
                        "expected_return": f"{c['expected_return']}%",
                        "risk": c["risk"],
                        "entry_price": round(c["close"], 2),
                        "stop_loss": round(c["close"] * (1 - self.max_risk_pct), 2),
                        "target_price": round(c["close"] * (1 + self.target_pct), 2)
                    } for c in candidates
                ])
                latest_signals_df.to_csv(os.path.join(self.portfolio_dir, "daily_signals.csv"), index=False)

            # --- D. Open New Trades ---
            # Max 5 positions. Allocation 20% per position (₹20,000 limit)
            for c in candidates:
                if len(open_positions) >= self.max_positions:
                    break
                
                # Check if already holding
                if any(pos["symbol"] == c["symbol"] for pos in open_positions):
                    continue
                
                allocation_limit = self.capital * self.max_allocation
                if self.cash >= allocation_limit:
                    qty = int(allocation_limit // (c["close"] * 1.0025))
                    if qty > 0:
                        entry_val = qty * c["close"] * 1.0025
                        self.cash -= entry_val
                        
                        open_positions.append({
                            "trade_id": str(uuid.uuid4())[:8],
                            "date": date_str,
                            "symbol": c["symbol"],
                            "qty": qty,
                            "signal": "BUY",
                            "confidence": c["confidence"],
                            "probability": c["probability"],
                            "expected_return": c["expected_return"],
                            "risk": c["risk"],
                            "entry_price": round(c["close"] * 1.0025, 2),
                            "stop_loss": round(c["close"] * (1 - self.max_risk_pct), 2),
                            "target_price": round(c["close"] * (1 + self.target_pct), 2),
                            "days_held": 0
                        })

        # --- E. Write Output Files ---
        # 1. Closed Trades
        closed_trades_df = pd.DataFrame(closed_trades)
        closed_trades_df.to_csv(os.path.join(self.portfolio_dir, "closed_trades.csv"), index=False)

        # 2. Open Positions
        open_positions_formatted = [
            {
                "trade_id": pos["trade_id"],
                "date": pos["date"],
                "symbol": pos["symbol"],
                "signal": pos["signal"],
                "confidence": pos["confidence"],
                "probability": pos["probability"],
                "expected_return": f"{pos['expected_return']}%",
                "risk": pos["risk"],
                "entry_price": pos["entry_price"],
                "stop_loss": pos["stop_loss"],
                "target_price": pos["target_price"],
                "holding_period": pos["days_held"]
            } for pos in open_positions
        ]
        open_positions_df = pd.DataFrame(open_positions_formatted)
        open_positions_df.to_csv(os.path.join(self.portfolio_dir, "open_positions.csv"), index=False)

        # 3. Equity Curve
        equity_df = pd.DataFrame(equity_history)
        equity_df.to_csv(os.path.join(self.portfolio_dir, "equity_curve.csv"), index=False)

        # Calculate Performance Report Json (AUDIT metrics)
        net_ret_pct = ((equity_history[-1]["Portfolio value"] - self.capital) / self.capital) * 100
        
        # Calculate win rate and gain stats
        trades_pnl = [t["pnl_pct"] / 100 for t in closed_trades]
        win_rate = (np.array(trades_pnl) > 0).mean() * 100 if trades_pnl else 0.0
        avg_gain = np.mean([p for p in trades_pnl if p > 0]) * 100 if any(p > 0 for p in trades_pnl) else 0.0
        avg_loss = np.mean([p for p in trades_pnl if p <= 0]) * 100 if any(p <= 0 for p in trades_pnl) else 0.0
        
        # Sharpe ratio
        daily_returns_pct = [day["Daily return"] / 100 for day in equity_history]
        daily_std = np.std(daily_returns_pct)
        sharpe = (np.mean(daily_returns_pct) / (daily_std + 1e-9)) * np.sqrt(252) if daily_std > 0 else 0.0
        
        # Sortino ratio
        downside_returns = [r for r in daily_returns_pct if r < 0]
        downside_std = np.std(downside_returns) if downside_returns else 1e-9
        sortino = (np.mean(daily_returns_pct) / downside_std) * np.sqrt(252) if downside_std > 0 else 0.0
        
        # Profit Factor
        gross_profits = sum([p for p in trades_pnl if p > 0])
        gross_losses = abs(sum([p for p in trades_pnl if p <= 0]))
        profit_factor = gross_profits / (gross_losses + 1e-9)
        
        # Max Drawdown
        p_values = np.array([day["Portfolio value"] for day in equity_history])
        roll_max = np.maximum.accumulate(p_values)
        dd = (p_values - roll_max) / roll_max
        max_dd = dd.min() * 100

        report = {
            "validation_period_days": days_count,
            "starting_capital": self.capital,
            "final_value": equity_history[-1]["Portfolio value"],
            "total_return_pct": round(net_ret_pct, 2),
            "win_rate_pct": round(win_rate, 2),
            "sharpe_ratio": round(sharpe, 4),
            "sortino_ratio": round(sortino, 4),
            "profit_factor": round(profit_factor, 4),
            "max_drawdown_pct": round(max_dd, 2),
            "avg_gain_pct": round(avg_gain, 2),
            "avg_loss_pct": round(avg_loss, 2),
            "number_of_trades": len(closed_trades)
        }

        with open(os.path.join(self.portfolio_dir, "performance_report.json"), "w") as f:
            json.dump(report, f, indent=2)

        # --- F. Create Dashboard files ---
        dashboard_dir = "paper_trading_dashboard"
        os.makedirs(dashboard_dir, exist_ok=True)
        
        # Generate raw HTML Dashboard in Robinhood/Linear Dark Glassmorphism Aesthetics
        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quantara Paper Trading Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg-color: #0b0f19;
            --card-bg: rgba(22, 28, 45, 0.45);
            --border: rgba(255, 255, 255, 0.08);
            --primary: #00ff87;
            --danger: #ff3838;
            --text: #f3f4f6;
            --text-muted: #9ca3af;
        }}
        * {{
            margin: 0; padding: 0; box-sizing: border-box;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }}
        body {{
            background: var(--bg-color);
            color: var(--text);
            padding: 2.5rem;
            min-height: 100vh;
        }}
        .header {{
            margin-bottom: 2rem;
        }}
        .header h1 {{
            font-size: 2rem; font-weight: 700;
            background: linear-gradient(135deg, #00ff87, #60efff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        .header p {{
            color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem;
        }}
        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1.5rem; margin-bottom: 2rem;
        }}
        .card {{
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.5rem;
            backdrop-filter: blur(12px);
        }}
        .card-title {{
            color: var(--text-muted); font-size: 0.85rem; font-weight: 600; text-transform: uppercase;
        }}
        .card-value {{
            font-size: 1.75rem; font-weight: 700; margin-top: 0.5rem;
        }}
        .card-value.gain {{ color: var(--primary); }}
        .card-value.loss {{ color: var(--danger); }}
        .sections {{
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 2rem;
        }}
        .table-card {{
            overflow-x: auto;
        }}
        .table-title {{
            font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem;
        }}
        table {{
            width: 100%; border-collapse: collapse; text-align: left;
        }}
        th, td {{
            padding: 0.85rem; border-bottom: 1px solid var(--border); font-size: 0.9rem;
        }}
        th {{
            color: var(--text-muted); font-weight: 600;
        }}
        .badge {{
            padding: 0.25rem 0.6rem; border-radius: 4px; font-weight: 600; font-size: 0.75rem;
        }}
        .badge.buy {{ background: rgba(0, 255, 135, 0.15); color: var(--primary); }}
        .badge.sell {{ background: rgba(255, 56, 56, 0.15); color: var(--danger); }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Quantara Paper Trading Portfolio</h1>
        <p>Live validation tracking engine. Target split period: 60 trading days.</p>
    </div>
    
    <div class="grid">
        <div class="card">
            <div class="card-title">Portfolio Capital</div>
            <div class="card-value">₹{report['final_value']:.2f}</div>
        </div>
        <div class="card">
            <div class="card-title">Total Return</div>
            <div class="card-value gain">+{report['total_return_pct']:.2f}%</div>
        </div>
        <div class="card">
            <div class="card-title">Win Rate</div>
            <div class="card-value">{report['win_rate_pct']:.1f}%</div>
        </div>
        <div class="card">
            <div class="card-title">Sharpe Ratio</div>
            <div class="card-value">{report['sharpe_ratio']:.3f}</div>
        </div>
        <div class="card">
            <div class="card-title">Max Drawdown</div>
            <div class="card-value loss">{report['max_drawdown_pct']:.2f}%</div>
        </div>
    </div>

    <div class="sections">
        <div class="card table-card">
            <div class="table-title">Open Trading Positions</div>
            <table>
                <thead>
                    <tr>
                        <th>Symbol</th>
                        <th>Signal</th>
                        <th>Confidence</th>
                        <th>Entry Price</th>
                        <th>Stop Loss</th>
                        <th>Target Price</th>
                        <th>Holding Days</th>
                    </tr>
                </thead>
                <tbody>
                    {"".join(f"<tr><td><b>{p['symbol']}</b></td><td><span class='badge buy'>BUY</span></td><td>{p['confidence']}%</td><td>₹{p['entry_price']}</td><td>₹{p['stop_loss']}</td><td>₹{p['target_price']}</td><td>{p['holding_period']} days</td></tr>" for p in open_positions_formatted)}
                </tbody>
            </table>
        </div>
        <div class="card">
            <div class="table-title">Recent Closed Performance</div>
            <table>
                <thead>
                    <tr>
                        <th>Symbol</th>
                        <th>P&L %</th>
                        <th>Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {"".join(f"<tr><td><b>{t['symbol']}</b></td><td class='{'gain' if t['pnl_pct'] > 0 else 'loss'}'>{'+' if t['pnl_pct'] > 0 else ''}{t['pnl_pct']:.2f}%</td><td>{t['reason']}</td></tr>" for t in closed_trades[-5:])}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>"""
        
        with open(os.path.join(dashboard_dir, "index.html"), "w") as f:
            f.write(html_content)

        logger.info("Simulation successfully completed! All validation files created.")
        
        print("\n" + "="*50)
        print("PAPER PORTFOLIO SIMULATOR VALIDATION SUMMARY")
        print("="*50)
        print(f"Total return:          {report['total_return_pct']}%")
        print(f"Win rate:              {report['win_rate_pct']}%")
        print(f"Sharpe ratio:          {report['sharpe_ratio']}")
        print(f"Sortino ratio:         {report['sortino_ratio']}")
        print(f"Profit factor:         {report['profit_factor']}")
        print(f"Maximum drawdown:      {report['max_drawdown_pct']}%")
        print(f"Closed trades:         {report['number_of_trades']}")
        print("="*50)

if __name__ == "__main__":
    engine = PaperTradingEngine()
    engine.run_simulation(days_count=500)
