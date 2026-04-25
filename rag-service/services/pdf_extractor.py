import fitz # PyMuPDF
import io

def extract_text_from_pdf(file_bytes: bytes) -> list:
    """Extracts text from a given PDF file bytes object using PyMuPDF."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages_data = []
    
    for page_num in range(len(doc)):
        text = doc[page_num].get_text()
        if text:
            pages_data.append({"text": text, "page": page_num + 1})
            
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
