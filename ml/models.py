import os
os.environ["HF_HUB_OFFLINE"] = "0"
os.environ["TRANSFORMERS_OFFLINE"] = "0"

from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, pipeline
import logging
import torch
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Determine best device (NVIDIA GPU if available)
device = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"AI Engine using device: {device}")

# Warm-up Logic

def warm_up():
    """Pre-loads core models into GPU to eliminate first-request lag."""
    try:
        logger.info("🔥 Warming up GPU engines...")
        get_summarizer()
        logger.info("✅ GPU Warm-up complete. System is ready.")
    except Exception as e:
        logger.error(f"Warm-up failed: {str(e)}")

# Lazy loading models
_model = None
_tokenizer = None
_classifier = None
_ocr_processor = None
_ocr_model = None
_tts_model = None
_tts_processor = None
_translation_models = {}
_premium_model = None
_premium_tokenizer = None

def get_premium_translator():
    """Lazy loads IndicTrans2 (SOTA Indian Language Model)."""
    global _premium_model, _premium_tokenizer
    if _premium_model is None:
        # Using the distilled 200M version: High quality but fits on laptop GPUs
        model_name = "ai4bharat/indictrans2-en-indic-dist-200m"
        logger.info(f"Loading Premium AI (IndicTrans2) on {device}...")
        _premium_tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        _premium_model = AutoModelForSeq2SeqLM.from_pretrained(model_name, trust_remote_code=True).to(device)
    return _premium_model, _premium_tokenizer

def get_translation_model(target_lang: str):
    """Lazy loads dedicated Helsinki-NLP models (Dravidian for Ta/Te)."""
    global _translation_models
    if target_lang == "en": return None, None
    
    model_key = f"en-{target_lang}"
    if model_key not in _translation_models:
        from transformers import MarianMTModel, MarianTokenizer
        
        # Hindi has its own model, Tamil/Telugu share the Dravidian model
        if target_lang == "hi":
            model_name = "Helsinki-NLP/opus-mt-en-hi"
        elif target_lang in ["ta", "te"]:
            model_name = "Helsinki-NLP/opus-mt-en-dra"
        else:
            model_name = f"Helsinki-NLP/opus-mt-en-{target_lang}"
            
        logger.info(f"Loading Translator ({model_name}) on {device}...")
        tokenizer = MarianTokenizer.from_pretrained(model_name)
        
        # Optimize with float16 for speed and VRAM efficiency
        model_kwargs = {"torch_dtype": torch.float16} if "cuda" in str(device) else {}
        model = MarianMTModel.from_pretrained(model_name, **model_kwargs).to(device)
        _translation_models[model_key] = (model, tokenizer)
        
    return _translation_models[model_key]

def translate_text(text: str, target_lang: str) -> str:
    """Translation using Helsinki-NLP with bullet-point splitting logic."""
    if not text or target_lang == "en": return text
    
    try:
        model, tokenizer = get_translation_model(target_lang)
        if not model: return text
        
        # Split by bullet points to preserve structure
        lines = []
        if "•" in text:
            lines = [line.strip() for line in text.split("•") if line.strip()]
            prefix = "• "
        elif "\n-" in text or text.startswith("-"):
            lines = [line.strip() for line in text.split("-") if line.strip()]
            prefix = "- "
        else:
            lines = [text]
            prefix = ""

        # Prevent VRAM overflow
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        translated_lines = []
        for line in lines:
            # Dravidian model (en-dra) used for Ta/Te requires specific prefixes
            clean_line = line
            if target_lang == "te":
                clean_line = f">>tel<< {line}"
            elif target_lang == "ta":
                clean_line = f">>tam<< {line}"
                
            inputs = tokenizer(clean_line, return_tensors="pt", padding=True, truncation=True).to(device)
            translated = model.generate(**inputs, max_length=512)
            translated_lines.append(tokenizer.decode(translated[0], skip_special_tokens=True))
            
        # Re-join with the original bullet character
        if prefix:
            return "\n".join([f"{prefix}{l}" for l in translated_lines])
        return translated_lines[0]
        
    except Exception as e:
        logger.error(f"Translation Error ({target_lang}): {str(e)}")
        return text

def get_summarizer():
    global _model, _tokenizer
    if _model is None or _tokenizer is None:
        # Upgrading to FLAN-T5-Base for significantly better reasoning
        logger.info(f"Loading Professional AI (google/flan-t5-base) on {device}...")
        model_name = "google/flan-t5-base"
        _tokenizer = AutoTokenizer.from_pretrained(model_name)
        _model = AutoModelForSeq2SeqLM.from_pretrained(model_name).to(device)
    return _model, _tokenizer

def get_ocr_model():
    """Loads Donut model with float16 optimization for laptop GPUs."""
    global _ocr_processor, _ocr_model
    if _ocr_model is None:
        from transformers import DonutProcessor, VisionEncoderDecoderModel
        logger.info(f"Loading Optimized Vision Model (naver-clova-ix/donut-base-finetuned-docvqa) on {device}...")
        _ocr_processor = DonutProcessor.from_pretrained("naver-clova-ix/donut-base-finetuned-docvqa")
        
        # Using float16 to save 50% VRAM on gaming laptops
        _ocr_model = VisionEncoderDecoderModel.from_pretrained(
            "naver-clova-ix/donut-base-finetuned-docvqa",
            torch_dtype=torch.float16 if device == "cuda" else torch.float32
        ).to(device)
    return _ocr_model, _ocr_processor

def get_tts_model():
    """Lightweight TTS fallback for Windows stability."""
    return None, None, None, None

def generate_speech(text: str) -> str:
    """Converts text to speech using gTTS for maximum stability on Windows."""
    from gtts import gTTS
    import io
    import base64
    
    try:
        # Create TTS object
        tts = gTTS(text=text[:600], lang='en')
        
        # Save to memory
        buffer = io.BytesIO()
        tts.write_to_fp(buffer)
        buffer.seek(0)
        
        # Encode as base64
        return base64.b64encode(buffer.read()).decode('utf-8')
    except Exception as e:
        logger.error(f"TTS Error: {str(e)}")
        return ""

def get_classifier():
    global _classifier
    if _classifier is None:
        logger.info("Loading Zero-Shot Classification Model...")
        _classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
    return _classifier

def clean_news_content(text: str) -> str:
    """Removes paywall noise, subscriptions, and other junk from scraped news."""
    if not text: return ""
    import re
    
    # List of common junk patterns found in scraped news
    junk_patterns = [
        r"only available in paid plans",
        r"subscribe to read the full story",
        r"premium content",
        r"sign up for free",
        r"click here to subscribe",
        r"read more in our app",
        r"all rights reserved",
        r"advertisement",
        r"follow us on (twitter|facebook|instagram|linkedin)",
        r"copyright © \d+",
        r"this story is for subscribers only",
        r"access to this article is restricted",
        r"please login to continue",
        r"already a subscriber\?",
        r"unlimited access to all our stories",
        r"to continue reading, please",
        r"get 24/7 access",
        r"support independent journalism"
    ]
    
    clean = text
    for pattern in junk_patterns:
        clean = re.sub(pattern, "", clean, flags=re.IGNORECASE)
    
    # Remove extra whitespace and strange formatting
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

def answer_question(question: str, context: str) -> list:
    """Uses the local T5 model to generate a detailed summary/answer (7-8 lines)."""
    model, tokenizer = get_summarizer()
    try:
        # Improved prompt for better context alignment
        input_text = f"answer the question using the provided context. question: {question} context: {context}"
        inputs = tokenizer(input_text, return_tensors="pt", max_length=1024, truncation=True).to(device)
        
        outputs = model.generate(
            **inputs, 
            max_length=512, 
            min_length=180, # Force more detailed exploration
            num_beams=5, 
            no_repeat_ngram_size=3,
            length_penalty=1.5,
            early_stopping=True
        )
        answer = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()
        
        # Improved sentence splitting to handle abbreviations (Mr., K., etc.)
        import re
        # Split by period followed by space, but NOT if preceded by common abbreviations
        raw_sentences = re.split(r'(?<![A-Z][a-z])(?<![A-Z])(?<=[.!?])\s+', answer)
        
        bullets = []
        current_sentence = ""
        
        for s in raw_sentences:
            # Aggressive character cleaning
            s = re.sub(r'[^a-zA-Z0-9\s\.,!\?\'\"-]', '', s).strip()
            
            if not s: continue
            
            # Stitching logic: If a "sentence" starts with lowercase or is very short, 
            # it likely belongs to the previous one
            if current_sentence and (s[0].islower() or len(current_sentence.split()) < 4):
                current_sentence = current_sentence.rstrip('.') + " " + s
            else:
                if current_sentence:
                    bullets.append(current_sentence)
                current_sentence = s
                
        if current_sentence:
            bullets.append(current_sentence)
            
        clean_sentences = []
        for b in bullets:
            # 1. Length & Junk Filter
            alnum_ratio = len(re.sub(r'[^a-zA-Z0-9]', '', b)) / max(len(b), 1)
            if len(b) > 25 and alnum_ratio > 0.7:
                # Removed strict keyword relevance filter to prevent "silent point deletion"
                b = b[0].upper() + b[1:]
                b = re.sub(r'\.+$', '.', b) # Ensure single dot ending
                if not b.endswith(('.', '!', '?')): b += "."
                clean_sentences.append(b)
        
        if not clean_sentences:
            return ["I've analyzed the document but couldn't generate a detailed answer. Try a more specific question."]
        return clean_sentences[:10] # Allow up to 10 points for complex docs
    except Exception as e:
        logger.error(f"Local T5 QA Error: {str(e)}")
        return ["I encountered an error while analyzing the document."]

def ocr_page(image) -> str:
    """Uses Donut to read text from an image (page)."""
    from PIL import Image
    import re
    model, processor = get_ocr_model()
    try:
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        # Donut specialized prompt for reading
        task_prompt = "<s_docvqa><s_question>Extract all text accurately</s_question><s_answer>"
        decoder_input_ids = processor.tokenizer(task_prompt, add_special_tokens=False, return_tensors="pt").input_ids.to(device)
        
        pixel_values = processor(image, return_tensors="pt").pixel_values.to(device)
        outputs = model.generate(
            pixel_values,
            decoder_input_ids=decoder_input_ids,
            max_length=768,
            early_stopping=True,
            pad_token_id=processor.tokenizer.pad_token_id,
            eos_token_id=processor.tokenizer.eos_token_id,
            use_cache=True,
        )
        
        sequence = processor.batch_decode(outputs)[0]
        # Clean up the output tags
        sequence = sequence.replace(processor.tokenizer.eos_token, "").replace(processor.tokenizer.pad_token, "")
        sequence = re.sub(r"<.*?>", "", sequence).strip()
        return sequence
    except Exception as e:
        logger.error(f"OCR Page Error (Donut): {str(e)}")
        return ""

def summarize_text(text: str, max_length: int = 500, min_length: int = 200, prompt_prefix: str = "summarize in detail: ") -> list:
    """Returns a detailed summary broken into 7-10 bullet points with fragment filtering."""
    model, tokenizer = get_summarizer()
    input_text = prompt_prefix + text[:4000] 
    inputs = tokenizer(input_text, return_tensors="pt", max_length=1024, truncation=True).to(device)
    outputs = model.generate(
        **inputs, 
        max_length=max_length, 
        min_length=min(min_length, 50), # Adaptive minimum to prevent hanging
        num_beams=4,
        no_repeat_ngram_size=3,
        length_penalty=1.0, # Reduced to prevent over-expansion
        early_stopping=True
    )
    summary_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    logger.info(f"RAW SUMMARY GENERATED: {summary_text}")
    
    # Sentence splitting
    raw_sentences = re.split(r'(?<![A-Z][a-z])(?<![A-Z])(?<=[.!?])\s+', summary_text)
    
    bullets = []
    current_sentence = ""
    for s in raw_sentences:
        s = re.sub(r'[^a-zA-Z0-9\s\.,!\?\'\"-]', '', s).strip()
        if not s or len(s) < 5: continue
        
        # Stitching
        if current_sentence and (s[0].islower() or len(current_sentence.split()) < 5):
            current_sentence = current_sentence.rstrip('.') + " " + s
        else:
            if current_sentence: bullets.append(current_sentence)
            current_sentence = s
            
    if current_sentence: bullets.append(current_sentence)
            
    clean_bullets = []
    for b in bullets:
        alnum_ratio = len(re.sub(r'[^a-zA-Z0-9]', '', b)) / max(len(b), 1)
        # Relaxed filtering to ensure we don't lose insights
        if len(b) > 15 and alnum_ratio > 0.6:
            b = b[0].upper() + b[1:]
            if not b.endswith(('.', '!', '?')): b += "."
            clean_bullets.append(b)

    # Robust Fallback: Actually summarize the original text if bullets failed
    if not clean_bullets and len(text) > 50:
        # Emergency secondary summarization with very relaxed constraints
        input_text = "summarize: " + text[:1000]
        inputs = tokenizer(input_text, return_tensors="pt").to(device)
        outputs = model.generate(**inputs, max_length=200)
        fallback = tokenizer.decode(outputs[0], skip_special_tokens=True)
        # Split fallback into points if possible
        if ". " in fallback:
            return [s.strip() + "." for s in fallback.split(". ") if len(s) > 10]
        return [fallback] if len(fallback) > 10 else ["Analysis complete. Results in Top Articles."]

    return clean_bullets[:10]

def classify_text(text: str, candidate_labels: list) -> str:
    classifier = get_classifier()
    result = classifier(text, candidate_labels)
    return result['labels'][0]
