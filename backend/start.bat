@echo off
cd /d "%~dp0"
echo Starting AI JanMitra Backend...
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
