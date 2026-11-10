import pdfplumber
import io
from langchain_core.tools import tool


@tool
async def extract_pdf_text(pdf_bytes: bytes) -> str:
    """Extract all plain text from a PDF file given its raw bytes."""
    text_parts = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts).strip()
