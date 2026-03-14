import base64
import re
from io import BytesIO
from typing import Dict, Any, List, Optional
from PIL import Image
import cv2
import numpy as np
import os
from app.services.llm import llm_service

class OCRService:
    def __init__(self):
        self.supported_languages = ['eng', 'hin', 'tam', 'tel', 'ben', 'mar', 'kan', 'guj', 'mal']
    
    def process_image_legacy(self, image_base64: str, languages: List[str] = None) -> str:
        """Original Tesseract-based OCR (Legacy Fallback)"""
        try:
            # Handle data URL prefix if present
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
                
            img_data = base64.b64decode(image_base64)
            image = Image.open(BytesIO(img_data))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Use default languages if not specified
            if not languages:
                languages = ['eng', 'hin']
            
            lang_code = '+'.join(languages)
            
            # Try to use pytesseract
            try:
                import pytesseract
                if os.name == 'nt':
                    tess_paths = [r'C:\Program Files\Tesseract-OCR\tesseract.exe', r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe', r'C:\Users\SAYAN ROY CHOWDHURY\AppData\Local\Programs\Tesseract-OCR\tesseract.exe']
                    for p in tess_paths:
                        if os.path.exists(p):
                            pytesseract.pytesseract.tesseract_cmd = p
                            break
                            
                text = pytesseract.image_to_string(image, lang=lang_code)
                return text.strip() if text.strip() else "No text could be extracted from image"
            except (ImportError, Exception) as e:
                return f"[Tesseract OCR failed: {str(e)}. Please check if tesseract is installed.]"
        except Exception as e:
            return f"[Error processing image: {str(e)}]"
            
    async def process_image(self, image_base64: str, languages: List[str] = None) -> str:
        """Extract text from image using OpenCV preprocessing and Pytesseract"""
        try:
            is_pdf = False
            if image_base64.startswith('data:application/pdf'):
                is_pdf = True
                
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
                
            img_data = base64.b64decode(image_base64)
            
            if is_pdf:
                import fitz
                doc = fitz.open(stream=img_data, filetype="pdf")
                text = ""
                for page in doc:
                    text += page.get_text()
                
                if text.strip():
                    return text.strip()
                
                # If no text (scanned PDF), use first page as image
                pix = doc[0].get_pixmap(dpi=300)
                nparr = np.frombuffer(pix.tobytes("jpeg"), np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            else:
                nparr = np.frombuffer(img_data, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Preprocessing for better OCR
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            # Apply adaptive thresholding or Otsu's thresholding
            # This makes the text pop out and normalizes lighting
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            if not languages:
                languages = ['eng', 'hin']
            lang_code = '+'.join(languages)
            
            import pytesseract
            if os.name == 'nt':
                tess_paths = [r'C:\Program Files\Tesseract-OCR\tesseract.exe', r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe', r'C:\Users\SAYAN ROY CHOWDHURY\AppData\Local\Programs\Tesseract-OCR\tesseract.exe']
                for p in tess_paths:
                    if os.path.exists(p):
                        pytesseract.pytesseract.tesseract_cmd = p
                        break
            else:
                # Standard path for Linux/Render deployments
                pytesseract.pytesseract.tesseract_cmd = '/usr/bin/tesseract'
                        
            text = pytesseract.image_to_string(binary, lang=lang_code)
            
            if not text.strip():
                # If cv2 preprocessing yielded nothing, try the basic pillow approach
                return self.process_image_legacy(image_base64, languages)
                
            return text.strip()
        except Exception as e:
            print("CV2/Tesseract failed, falling back", e)
            return self.process_image_legacy(image_base64, languages)
    
    def extract_entities(self, text: str) -> Dict[str, Any]:
        """Extract key entities from text using regex"""
        entities = {}
        
        # Court names
        court_match = re.search(r'(?:District|High|Supreme)\s+Court[:\s]*([A-Za-z\s,]+)', text, re.IGNORECASE)
        if court_match:
            entities['court'] = court_match.group(0).strip()
        
        # Case numbers
        case_match = re.search(r'(?:Case|CNR|FIR)\s*(?:No\.?|Number)[:\s]*([A-Z0-9/\-]+)', text, re.IGNORECASE)
        if case_match:
            entities['case_number'] = case_match.group(1).strip()
        
        # Phone numbers (Indian format)
        phone_matches = re.findall(r'(?:\+91|0)?[6-9]\d{9}', text)
        if phone_matches:
            entities['phones'] = list(set(phone_matches))
        
        # UPI IDs
        upi_matches = re.findall(r'([a-zA-Z0-9._-]+@[a-zA-Z0-9_-]+)', text)
        if upi_matches:
            entities['upi_ids'] = list(set(upi_matches))
        
        # Amounts
        amount_matches = re.findall(r'(?:Rs\.?|INR|₹)\s*(\d+(?:,\d+)*(?:\.\d{2})?)', text)
        if amount_matches:
            entities['amounts'] = list(set(amount_matches))
            
        # Dates
        date_matches = re.findall(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text)
        if date_matches:
            entities['dates'] = list(set(date_matches))
        
        return entities

    def analyze_for_scam(self, text: str) -> Dict[str, Any]:
        """Pattern-based scam analysis"""
        text_lower = text.lower()
        red_flags = []
        
        # Identity Document detection
        is_id_card = any(word in text_lower for word in ['voter', 'election', 'commission', 'aadhaar', 'pan card', 'driving license', 'passport'])
        
        # Threat / Fake Authority Patterns
        if any(word in text_lower for word in ['cbi', 'narcotics', 'customs', 'trai', 'fcc']) and any(word in text_lower for word in ['suspend', 'block', 'arrest', 'seize', 'illegal']):
            red_flags.append("Fake authority threat (CBI/Customs/TRAI) detected")
            
        # Common scam patterns
        if 'upi' in text_lower or 'gpay' in text_lower or 'phonepe' in text_lower:
            if any(word in text_lower for word in ['refund', 'claim', 'receive', 'cashback']):
                red_flags.append("Suspicious UPI cashback or refund request")
        
        if any(word in text_lower for word in ['arrest', 'police', 'jail', 'warrant', 'custody', 'prison']):
            red_flags.append("Arrest/police threat language used to create fear")
        
        if 'court' in text_lower and any(word in text_lower for word in ['fee', 'payment', 'penalty', 'fine']):
            red_flags.append("Request for court fees or penalties via unofficial channels")
        
        if any(word in text_lower for word in ['urgent', 'immediate', 'within 24 hours', '48 hours', 'today']):
            red_flags.append("Extreme urgency/deadline used to pressure you")
            
        if any(word in text_lower for word in ['lottery', 'prize', 'won', 'reward', 'kbc']):
            red_flags.append("Lottery or prize win notification (common scam)")

        if any(word in text_lower for word in ['disconnection', 'electricity', 'power bill']) and any(word in text_lower for word in ['update', 'pay now', 'tonight']):
            red_flags.append("Fake electricity disconnection threat")

        # UPI domain check
        upi_matches = re.findall(r'([a-zA-Z0-9._-]+@[a-zA-Z0-9_-]+)', text_lower)
        for upi in upi_matches:
            if upi.endswith('.gov.in') or upi.endswith('@sbi') or upi.endswith('@ybl') or upi.endswith('@icici'):
                continue
            red_flags.append(f"Suspicious unofficial UPI ID detected: {upi}")
        
        # Calculate confidence
        confidence = min(0.3 + len(red_flags) * 0.2, 0.95)
        
        verdict = "unverifiable"
        if len(red_flags) >= 1:
            verdict = "suspicious"
        if len(red_flags) >= 3:
            verdict = "high_risk"
        elif is_id_card and len(red_flags) == 0:
            verdict = "safe"
            confidence = 0.9
            
        return {
            'red_flags': red_flags,
            'verdict': verdict,
            'confidence': confidence
        }

    async def analyze_with_llm(self, text: str, language: str = "hi") -> Dict[str, Any]:
        """Use LLM for deep scam analysis of OCR text"""
        if "[OCR not available" in text or "No text could be extracted" in text:
            return self.analyze_for_scam(text)

        system_prompt = """You are a Cyber Security Expert specializing in Indian digital scams and Certificate Verification.
        Analyze the provided OCR text from a document, certificate or message.
        Identify if it is a scam (fake court notice, electricity bill scam, fake educational or employment certificate, etc.).
        Verify the authenticity based on typical formatting norms (line and space orientation, mismatching details).
        
        Provide your analysis in JSON format with:
        - verdict: "authentic", "suspicious", "high_risk", or "unverifiable"
        - confidence: 0.0 to 1.0
        - red_flags: List of specific reasons why it might be a scam
        - explanation: A brief explanation of your finding in simple terms
        - safe_actions: List of steps the user should take
        """
        
        user_message = f"OCR Text to analyze:\n{text}\n\nPlease analyze this for potential fraud."
        
        try:
            response_text = await llm_service.generate(system_prompt, user_message)
            # Try to parse JSON from response
            json_match = re.search(r'(\{.*\})', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            else:
                # Fallback if LLM doesn't return JSON
                return self.analyze_for_scam(text)
        except Exception:
            return self.analyze_for_scam(text)

ocr_service = OCRService()
