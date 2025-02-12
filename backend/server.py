from flask import Flask, request, jsonify
from paddleocr import PaddleOCR
import pytesseract
from PIL import Image
import os
import requests
from dotenv import load_dotenv
from flask_cors import CORS

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow all origins

# Set TESSDATA_PREFIX
TESSDATA_DIR = r"C:\Program Files\Tesseract-OCR\tessdata"
os.environ["TESSDATA_PREFIX"] = TESSDATA_DIR

# Initialize PaddleOCR models
ocr_models = {
    'te': PaddleOCR(use_angle_cls=True, lang='te'),  # Telugu
    'hi': PaddleOCR(use_angle_cls=True, lang='hi'),  # Hindi
    'ta': PaddleOCR(use_angle_cls=True, lang='ta'),  # Tamil
    'mr': PaddleOCR(use_angle_cls=True, lang='mr'),  # Marathi
    'en': PaddleOCR(use_angle_cls=True, lang='en')   # English
}

# Languages handled by Tesseract OCR
tesseract_languages = {'eng': 'eng', 'mal': 'mal', 'kan': 'kan'}  # Malayalam, Kannada

# Get LLM API details from environment variables
LLM_API_URL = os.getenv('LLM_API_URL')
LLM_API_KEY = os.getenv('LLM_API_KEY')

if not LLM_API_URL or not LLM_API_KEY:
    raise ValueError("LLM_API_URL and LLM_API_KEY must be set in the environment variables.")

def perform_tesseract_ocr(image_path, lang_code):
    """Perform OCR using Tesseract for the specified language."""
    try:
        image = Image.open(image_path)
        extracted_text = pytesseract.image_to_string(image, lang=tesseract_languages[lang_code])
        return extracted_text.strip()
    except Exception as e:
        print(f"Tesseract OCR error: {e}")
        return ''

def perform_paddleocr(image_path, lang_code):
    """Perform OCR using PaddleOCR for the specified language."""
    try:
        ocr_model = ocr_models.get(lang_code, ocr_models['en'])  # Default to English
        results = ocr_model.ocr(image_path, cls=True)
        return ' '.join(line[1][0] for result in results for line in result)
    except Exception as e:
        print(f"PaddleOCR error: {e}")
        return ''

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    # Get the selected language from the request
    selected_language = request.form.get('language', 'en').lower()  # Default to 'en' if not provided

    if selected_language not in ocr_models and selected_language not in tesseract_languages:
        return jsonify({'error': 'Unsupported language'}), 400

    image_file = request.files['image']
    image_path = 'uploaded_image.png'
    image_file.save(image_path)

    try:
        extracted_text = ''
        
        if selected_language in tesseract_languages:
            extracted_text = perform_tesseract_ocr(image_path, selected_language)
            
            # If no text is extracted and language is English, switch to PaddleOCR
            if not extracted_text and selected_language == 'eng':
                print("Switching to PaddleOCR for English text extraction")
                extracted_text = perform_paddleocr(image_path, 'en')
        else:
            extracted_text = perform_paddleocr(image_path, selected_language)

        print(f"Extracted Text: {extracted_text}")  # Debugging output

        # Prepare payload for LLM API
        payload = {
            'model': 'llama3-70b-8192',
            'messages': [
                {'role': 'system', 'content': f'You are a helpful assistant that corrects text in {selected_language}.'},
                {'role': 'user', 'content': f"Please correct the errors in the following text extracted from a handwritten image and return only the corrected version in the respective language, without explanations or additional comments and also dont mention Here is the corrected text:\n\n{extracted_text}"}
            ],
            'max_tokens': 1000
        }
        headers = {
            'Authorization': f'Bearer {LLM_API_KEY}',
            'Content-Type': 'application/json'
        }

        # Call LLM API
        llm_response = requests.post(LLM_API_URL, json=payload, headers=headers)
        response_data = llm_response.json()
        print('LLM API Response:', response_data)
        # Extract corrected text
        corrected_text = response_data.get('choices', [{}])[0].get('message', {}).get('content', '').strip()
        
        if not corrected_text:
            corrected_text = "LLM API did not return a response."

        print('Corrected Text:', corrected_text)

        return jsonify({'correctedText': corrected_text, 'language': selected_language})

    except Exception as e:
        print(e)
        return jsonify({'error': 'Error processing image'}), 500

    finally:
        if os.path.exists(image_path):
            os.remove(image_path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
