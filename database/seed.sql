-- Quantara Database Seed Scripts

-- Insert Mock User
INSERT INTO users (id, email, hashed_password)
VALUES 
    ('d3b07384-d113-4956-be60-d31e5f8f5370', 'dev@quantara.io', '$2b$12$EixZaYVK1fsAH1pt8.2J.O3O7FG1SFK59A/6gD.nC.O8aZ9E/8W9y')
ON CONFLICT (email) DO NOTHING;

-- Insert Mock Portfolio
INSERT INTO portfolios (id, user_id, name, cash_balance)
VALUES
    ('c3d2e1b0-1234-5678-abcd-ef0123456789', 'd3b07384-d113-4956-be60-d31e5f8f5370', 'Primary Portfolio', 34780.20)
ON CONFLICT DO NOTHING;

-- Insert Mock Assets
INSERT INTO assets (portfolio_id, symbol, shares, avg_buy_price)
VALUES
    ('c3d2e1b0-1234-5678-abcd-ef0123456789', 'AAPL', 12.5000, 172.50),
    ('c3d2e1b0-1234-5678-abcd-ef0123456789', 'NVDA', 25.0000, 820.00)
ON CONFLICT DO NOTHING;

-- Insert Mock Prediction Runs
INSERT INTO prediction_logs (symbol, sentiment, score, summary)
VALUES
    ('AAPL', 'Bullish', 85.00, 'Exponential moving averages indicate continuous upward momentum.'),
    ('TSLA', 'Neutral', 45.00, 'RSI oscillates in consolidation bounds.'),
    ('BTC', 'Bearish', 21.00, 'Short-term MACD death cross formed.');
