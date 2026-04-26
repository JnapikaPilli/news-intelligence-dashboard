from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, pipeline
import logging
import os

import torch

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Determine best device (NVIDIA GPU if available)
device = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"AI Engine using device: {device}")

# Lazy loading models
_model = None
_tokenizer = None
_classifier = None
_ocr_processor = None
_ocr_model = None
_tts_model = None
_tts_processor = None
_tts_vocoder = None
_speaker_embeddings = None

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

def answer_question(question: str, context: str) -> list:
    """Uses the local T5 model to generate a detailed summary/answer (7-8 lines)."""
    model, tokenizer = get_summarizer()
    try:
        # Using a more descriptive prompt to encourage length
        input_text = f"explain in detail: {question} based on this context: {context}"
        inputs = tokenizer(input_text, return_tensors="pt", max_length=1024, truncation=True).to(device)
        
        outputs = model.generate(
            **inputs, 
            max_length=512, 
            min_length=150,
            num_beams=4, 
            no_repeat_ngram_size=3,
            length_penalty=2.0,
            early_stopping=True
        )
        answer = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()
        
        # De-hyphenation (join split words like "metrowa- ter")
        import re
        answer = re.sub(r'(\w+)-\s+(\w+)', r'\1\2', answer)
        
        # Smart splitting and fragment filtering
        raw_sentences = re.split(r'(?<=[.!?])\s+', answer)
        clean_sentences = []
        
        # Identify key words from question for relevance filtering
        query_words = set(re.findall(r'\w+', (question or "").lower()))
        stop_words = {'what', 'is', 'the', 'of', 'in', 'and', 'to', 'for', 'explain', 'detail', 'based', 'on', 'give', 'about'}
        key_query_words = query_words - stop_words

        for s in raw_sentences:
            # Aggressive character cleaning (removes symbols like »»»)
            s = re.sub(r'[^a-zA-Z0-9\s\.,!\?\'\"-]', '', s).strip()
            
            # 1. Length & Junk Filter
            alnum_ratio = len(re.sub(r'[^a-zA-Z0-9]', '', s)) / max(len(s), 1)
            if len(s) > 25 and alnum_ratio > 0.7:
                
                # 2. Relevance Filter: Does this sentence mention the topic?
                s_lower = s.lower()
                is_relevant = any(word in s_lower for word in key_query_words) if key_query_words else True
                
                if is_relevant:
                    s = s[0].upper() + s[1:]
                    s = re.sub(r'\.+$', '.', s) # Ensure single dot ending
                    if not s.endswith(('.', '!', '?')): s += "."
                    clean_sentences.append(s)
        
        if not clean_sentences:
            return ["I've analyzed the document but couldn't find relevant detailed information for this specific topic."]
        return clean_sentences[:8]
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

def summarize_text(text: str, max_length: int = 400, min_length: int = 150) -> list:
    """Returns a detailed summary broken into 7-8 bullet points with fragment filtering."""
    model, tokenizer = get_summarizer()
    input_text = "summarize in detail: " + text[:3000] 
    inputs = tokenizer(input_text, return_tensors="pt", max_length=512, truncation=True).to(device)
    outputs = model.generate(
        **inputs, 
        max_length=max_length, 
        min_length=min_length, 
        num_beams=4,
        no_repeat_ngram_size=2,
        length_penalty=2.0,
        do_sample=False
    )
    summary_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    import re
    # De-hyphenation and Clean
    summary_text = re.sub(r'(\w+)-\s+(\w+)', r'\1\2', summary_text)
    
    raw_sentences = re.split(r'(?<=[.!?])\s+', summary_text)
    bullets = []
    for s in raw_sentences:
        # Aggressive cleaning (removes junk characters)
        s = re.sub(r'[^a-zA-Z0-9\s\.,!\?\'\"-]', '', s).strip()
        alnum_ratio = len(re.sub(r'[^a-zA-Z0-9]', '', s)) / max(len(s), 1)
        if len(s) > 25 and alnum_ratio > 0.7:
            s = s[0].upper() + s[1:]
            s = re.sub(r'\.+$', '.', s) # Force single dot ending
            if not s.endswith(('.', '!', '?')): s += "."
            bullets.append(s)
            
    # Fallback: If AI fails to generate meaningful bullets, extract first 3 sentences
    if not bullets:
        fallback_sentences = re.split(r'(?<=[.!?])\s+', text[:1000])
        for s in fallback_sentences[:3]:
            s = re.sub(r'[^a-zA-Z0-9\s\.,!\?\'\"-]', '', s).strip()
            if len(s) > 10:
                if not s.endswith(('.', '!', '?')): s += "."
                bullets.append(s)

    return bullets[:8]

def classify_text(text: str, candidate_labels: list) -> str:
    classifier = get_classifier()
    result = classifier(text, candidate_labels)
    return result['labels'][0]
