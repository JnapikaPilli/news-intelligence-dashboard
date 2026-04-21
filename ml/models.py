from transformers import pipeline
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lazy loading models
_summarizer = None
_translator = None
_classifier = None

def get_summarizer():
    global _summarizer
    if _summarizer is None:
        logger.info("Loading Summarization Model (BART-large-cnn)...")
        _summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
    return _summarizer

def get_translator():
    global _translator
    if _translator is None:
        pass # placeholder - translation models are heavy, might use m2m100 or skipping for lightweight MVP
    return _translator

def get_classifier():
    global _classifier
    if _classifier is None:
        logger.info("Loading Zero-Shot Classification Model...")
        _classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
    return _classifier

def summarize_text(text: str, max_length: int = 130, min_length: int = 30) -> list:
    """Returns a summarized text broken into bullet points."""
    summarizer = get_summarizer()
    summary = summarizer(text, max_length=max_length, min_length=min_length, do_sample=False)
    # Simple logic to split sentences into bullets
    summary_text = summary[0]['summary_text']
    bullets = [sentence.strip() + "." for sentence in summary_text.split('.') if len(sentence) > 10]
    return bullets[:5] # Max 5 bullets

def classify_text(text: str, candidate_labels: list) -> str:
    classifier = get_classifier()
    result = classifier(text, candidate_labels)
    return result['labels'][0] # Return the most likely label
