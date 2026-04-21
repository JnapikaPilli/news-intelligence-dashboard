import PyPDF2
import io

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text from a given PDF file bytes object."""
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    complete_text = []
    
    for page_num in range(len(pdf_reader.pages)):
        page = pdf_reader.pages[page_num]
        text = page.extract_text()
        if text:
            complete_text.append(text)
            
    return "\n".join(complete_text)

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list:
    """Splits a long string into chunks."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks
