import fitz
from PIL import Image
import sys
import os

# Add root folder to sys path to import ml
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from ml.models import ocr_page # PyMuPDF
import io

def clean_pdf_text(text: str) -> str:
    """Cleans noisy PDF text: merges hyphens, removes headers, normalizes space."""
    import re
    if not text: return ""
    
    # 1. Merge hyphenated words across line breaks (e.g., "Pan-\nneerselvam" -> "Panneerselvam")
    # This also handles cases with extra spaces
    text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', text)
    
    # 2. Split into lines to filter noise
    lines = text.split('\n')
    clean_lines = []
    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Filter all-caps headers (e.g. "CHAPTER ONE", "PAGE 5", "A CH-CHE CM YK")
        if re.match(r'^[A-Z\s\-0-9]{10,}$', line): continue
        
        # Filter short junk lines (less than 4 chars or mostly symbols)
        alnum_ratio = len(re.sub(r'[^a-zA-Z0-9]', '', line)) / max(len(line), 1)
        if len(line) < 4 or alnum_ratio < 0.5: continue
        
        clean_lines.append(line)
    
    # 3. Merge lines and normalize spaces
    normalized = " ".join(clean_lines)
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    
    return normalized

def extract_text_from_pdf(file_bytes: bytes) -> list:
    """Extracts and CLEANS text from a given PDF file bytes object using PyMuPDF."""
    import logging
    logger = logging.getLogger(__name__)
    
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages_data = []
    total_images = 0
    
    logger.info(f"Opening PDF with {len(doc)} pages")
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        # Try standard text extraction
        text = page.get_text().strip()
        
        # AI VISION FALLBACK: If text is empty or mostly garbage (limit to first 10 pages with GPU)
        import re
        alnum_text = re.sub(r'[^a-zA-Z0-9]', '', text)
        
        if len(alnum_text) < 10 and page_num < 10:
            logger.info(f"--- AI VISION MODE: Reading page {page_num + 1} with Donut (GPU Accelerated)... ---")
            try:
                pix = page.get_pixmap()
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                text = ocr_page(img)
            except Exception as e:
                logger.error(f"Vision Mode Error on page {page_num+1}: {str(e)}")
        
        # Apply NEW cleaning step BEFORE saving
        cleaned_text = clean_pdf_text(text)
        
        # Track images for diagnostics
        total_images += len(page.get_images())
        
        if cleaned_text:
            pages_data.append({"text": cleaned_text, "page": page_num + 1})
            
    if not pages_data and total_images > 0:
        logger.warning(f"No text found but {total_images} images detected. This is likely a SCANNED or IMAGE-BASED PDF.")
    
    return pages_data

def chunk_text(pages_data: list, chunk_size: int = 500, overlap: int = 150) -> list:
    """Splits ALREADY CLEANED text into chunks while preserving page numbers."""
    chunks_with_meta = []
    for page_data in pages_data:
        text = page_data["text"]
        page_num = page_data["page"]
        words = text.split()
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i:i + chunk_size])
            if len(chunk.strip()) > 10:
                chunks_with_meta.append({
                    "chunk": chunk,
                    "page": page_num
                })
    return chunks_with_meta
