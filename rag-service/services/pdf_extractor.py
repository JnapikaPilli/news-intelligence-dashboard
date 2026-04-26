import fitz
from PIL import Image
import sys
import os

# Add root folder to sys path to import ml
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from ml.models import ocr_page # PyMuPDF
import io

def extract_text_from_pdf(file_bytes: bytes) -> list:
    """Extracts text from a given PDF file bytes object using PyMuPDF."""
    import logging
    logger = logging.getLogger(__name__)
    
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages_data = []
    total_images = 0
    
    print(f"DEBUG: Opening PDF with {len(doc)} pages")
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        # Try standard text extraction
        text = page.get_text().strip()
        
        # AI VISION FALLBACK: If text is empty or mostly garbage (limit to first 10 pages with GPU)
        import re
        alnum_text = re.sub(r'[^a-zA-Z0-9]', '', text)
        
        if len(alnum_text) < 10 and page_num < 10:
            print(f"--- AI VISION MODE: Reading page {page_num + 1} with Donut (GPU Accelerated)... ---")
            try:
                pix = page.get_pixmap()
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                text = ocr_page(img)
            except Exception as e:
                print(f"Vision Mode Error on page {page_num+1}: {str(e)}")
        
        # Track images for diagnostics
        total_images += len(page.get_images())
        
        if text:
            pages_data.append({"text": text, "page": page_num + 1})
            
    if not pages_data and total_images > 0:
        print(f"DIAGNOSTIC: No text found but {total_images} images detected. This is likely a SCANNED or IMAGE-BASED PDF.")
    
    return pages_data

def chunk_text(pages_data: list, chunk_size: int = 500, overlap: int = 50) -> list:
    """Splits text into chunks while preserving page numbers."""
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
