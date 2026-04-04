import sys

def extract():
    path = sys.argv[1]
    
    # Try PyMuPDF (fitz)
    try:
        import fitz
        doc = fitz.open(path)
        text = "\n".join([page.get_text() for page in doc])
        return text
    except ImportError:
        pass
        
    # Try pypdf
    try:
        import pypdf
        reader = pypdf.PdfReader(path)
        text = "\n".join([page.extract_text() for page in reader.pages])
        return text
    except ImportError:
        pass
        
    # Try PyPDF2
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(path)
        text = "\n".join([page.extract_text() for page in reader.pages])
        return text
    except ImportError:
        pass
        
    print("No supported PDF library found. Please install pymupdf or pypdf.", file=sys.stderr)
    return ""

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: extract_pdf.py <pdf_path>", file=sys.stderr)
        sys.exit(1)
    try:
        text = extract()
        if text:
            with open("pdf_content.txt", "w", encoding="utf-8") as f:
                f.write(text)
            print("Successfully extracted to pdf_content.txt")
        else:
            print("Failed to extract text.")
            sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
