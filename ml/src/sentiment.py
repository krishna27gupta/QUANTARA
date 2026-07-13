import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List

logger = logging.getLogger("quantara-ml-sentiment")

# A small, genuinely bidirectional finance-relevant word list. This is NOT a trained
# model and should never be labeled as one (the previous version claimed to be
# "FinBERT" while doing simple keyword matching, and its keyword list only contained
# positive words - "breakout", "buy", "growth" - so it silently scored every single
# input as positive, every time, because the hardcoded mock news text in main.py
# always contained one of those words).
POSITIVE_WORDS = {
    "breakout", "buy", "growth", "surge", "rally", "upgrade", "outperform",
    "accumulation", "bullish", "beat", "record", "strong", "gain", "rebound",
}
NEGATIVE_WORDS = {
    "fall", "drop", "sell", "weak", "downgrade", "underperform", "bearish",
    "miss", "decline", "loss", "plunge", "crash", "concern", "warning",
}


class BaseSentimentEngine(ABC):
    @abstractmethod
    async def analyze_sentiment(self, text_items: List[str]) -> Dict[str, Any]:
        pass


class SentimentEngine(BaseSentimentEngine):
    """
    Rule-based lexicon sentiment scorer - NOT a trained/learned model.

    HONESTY NOTE: a real FinBERT deployment needs (a) a transformer model download
    (requires internet access to huggingface.co, which isn't available in this build
    environment) and (b) a real news/headline feed for the stock in question (the
    live API currently uses 3 hardcoded mock sentences per request - see main.py -
    which means sentiment is not actually reading real news yet regardless of which
    scoring method is used). Both need to be wired up before sentiment adds real
    signal. Until then, this component honestly reports what it is: a word-count
    heuristic, correctly capable of reading negative text (the old version never
    could), not a source of genuine alpha.
    """

    def __init__(self):
        self.version = "2.0.0"

    async def analyze_sentiment(self, data: Dict[str, Any]) -> Dict[str, Any]:
        symbol = data.get("symbol")
        text_items = []
        
        if symbol:
            try:
                import yfinance as yf
                yf_symbol = f"{symbol}.NS" if not symbol.endswith(".NS") else symbol
                logger.info(f"Fetching news for {yf_symbol} via yfinance...")
                ticker = yf.Ticker(yf_symbol)
                news = ticker.news
                if news:
                    # Extract titles up to 10 headlines
                    for item in news[:10]:
                        title = item.get("content", {}).get("title") or item.get("title")
                        if title:
                            text_items.append(title)
                
                logger.info(f"Sentiment: found {len(text_items)} headlines for {symbol}")
            except Exception as e:
                logger.warning(f"Failed to fetch news for {symbol}: {e}")
        
        if not text_items:
            logger.warning(f"No news found or provided for {symbol}, falling back to placeholder.")
            text_items = [f"No live news feed configured for {symbol} yet."]
            return {
                "model_type": "Rule-based Lexicon (not a trained model)",
                "model_version": self.version,
                "sentiment_label": "Neutral",
                "sentiment_score": 0.50,
            }

        scores = []
        for item in text_items:
            words = set(item.lower().replace(".", "").replace(",", "").split())
            pos_hits = len(words & POSITIVE_WORDS)
            neg_hits = len(words & NEGATIVE_WORDS)
            if pos_hits == 0 and neg_hits == 0:
                scores.append(0.50)
            else:
                # net signal mapped into [0, 1], centered at 0.5
                net = (pos_hits - neg_hits) / max(pos_hits + neg_hits, 1)
                scores.append(round(0.5 + net * 0.4, 4))

        avg_score = round(sum(scores) / len(scores), 4)
        label = "Positive" if avg_score >= 0.65 else ("Negative" if avg_score <= 0.35 else "Neutral")

        return {
            "model_type": "Rule-based Lexicon (not a trained model)",
            "model_version": self.version,
            "sentiment_score": avg_score,
            "sentiment_label": label,
            "caveat": "Word-count heuristic on whatever text is passed in - not FinBERT, and not yet reading real news (see docstring).",
        }

