POSITIVE_WORDS = ["great", "excellent", "good", "amazing", "fast", "happy", "love", "perfect", "awesome", "wonderful"]
NEGATIVE_WORDS = ["bad", "terrible", "slow", "awful", "poor", "late", "horrible", "worst", "angry", "disappointed"]


def classify_sentiment(text: str) -> str:
    if not text:
        return "neutral"
    lower = text.lower()
    pos = sum(1 for w in POSITIVE_WORDS if w in lower)
    neg = sum(1 for w in NEGATIVE_WORDS if w in lower)
    if pos > neg:
        return "positive"
    elif neg > pos:
        return "negative"
    return "neutral"
