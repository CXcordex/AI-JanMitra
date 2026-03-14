import pytesseract
from PIL import Image
import base64
from io import BytesIO

pytesseract.pytesseract.tesseract_cmd = r'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'  # Windows path

def ocr_image(base64_data: str) -> str:
    """OCR from base64 image"""
    img_data = base64.b64decode(base64_data)
    image = Image.open(BytesIO(img_data))
    text = pytesseract.image_to_string(image, lang='eng+hin')
    return text.strip()

# Scam analysis pattern match
SCAM_PATTERNS = [
    'UPI', 'immediate payment', 'arrest', 'legal notice', 'court fee', '@okicici'
]

def analyze_scam(text: str):
    flags = [p for p in SCAM_PATTERNS if p.lower() in text.lower()]
    confidence = min(len(flags) * 0.3, 0.95)
    verdict = 'suspicious' if flags else 'safe'
    return {
        'ocr_text': text,
        'verdict': verdict,
        'confidence': confidence,
        'flags': flags or ['No obvious fraud']
    }

