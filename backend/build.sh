#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install OS level dependencies for OCR
apt-get update && apt-get install -y tesseract-ocr tesseract-ocr-hin libgl1 libglib2.0-0

# Install Python requirements
pip install -r requirements.txt
