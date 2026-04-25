from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, pipeline
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lazy loading models
_model = None
_tokenizer = None
_classifier = None

def get_summarizer():
    global _model, _tokenizer
    if _model is None or _tokenizer is None:
        logger.info("Loading Summarization Model (t5-small)...")
        model_name = "t5-small"
        _tokenizer = AutoTokenizer.from_pretrained(model_name)
        _model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
    return _model, _tokenizer

def get_classifier():
    global _classifier
    if _classifier is None:
        logger.info("Loading Zero-Shot Classification Model...")
        _classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
    return _classifier

def summarize_text(text: str, max_length: int = 150, min_length: int = 40) -> list:
    """Returns a summarized text broken into bullet points using t5-small."""
    model, tokenizer = get_summarizer()
    
    # Prepend summarize prompt for t5
    input_text = "summarize: " + text
    
    # Truncate text roughly to avoid max token errors
    input_text = input_text[:2000] 
    
    inputs = tokenizer(input_text, return_tensors="pt", max_length=512, truncation=True)
    outputs = model.generate(
        **inputs, 
        max_length=max_length, 
        min_length=min_length, 
        do_sample=False
    )
    summary_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Simple logic to split sentences into bullets, cleaning up punctuation
    bullets = [sentence.strip().capitalize() + "." for sentence in summary_text.replace("..", ".").split('.') if len(sentence.strip()) > 10]
    
    # Ensure simple language & 5 points max
    return bullets[:5]

def classify_text(text: str, candidate_labels: list) -> str:
    classifier = get_classifier()
    result = classifier(text, candidate_labels)
    return result['labels'][0]
