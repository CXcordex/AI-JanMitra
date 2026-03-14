import { useState, useRef, useEffect } from 'react';
import './FloatingWidget.css';

// Use proxy - frontend will forward to backend
const API_BASE = '';

const LANGUAGES = [
  { code: 'en', label: 'English', name: 'English' },
  { code: 'hi', label: 'हिंदी', name: 'Hindi' },
  { code: 'ta', label: 'தமிழ்', name: 'Tamil' },
  { code: 'bn', label: 'বাংলা', name: 'Bengali' },
  { code: 'te', label: 'తెలుగు', name: 'Telugu' },
  { code: 'mr', label: 'मराठी', name: 'Marathi' },
  { code: 'kn', label: 'ಕನ್ನಡ', name: 'Kannada' },
  { code: 'gu', label: 'ગુજરાતી', name: 'Gujarati' },
];

const QUICK_CHIPS = [
  { msg: 'मुझे RTI कैसे file करनी है?', label: 'RTI कैसे file करें?' },
  { msg: 'Which schemes am I eligible for as a farmer?', label: 'Farmer schemes' },
  { msg: 'Is this message a scam?', label: 'Scam detect करें' },
  { msg: 'मेरे consumer rights क्या हैं?', label: 'Consumer rights' },
];

export default function FloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('hi');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingImagePreview, setPendingImagePreview] = useState(null);
  const [recognition, setRecognition] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleChipClick = (msg) => {
    setInputText(msg);
    setTimeout(() => sendMessage(msg), 100);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setPendingImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPendingImagePreview(ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearImage = () => {
    setPendingImage(null);
    setPendingImagePreview(null);
  };

  const toggleVoice = () => {
    if (isRecording) {
      if (recognition) recognition.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input not supported. Try Chrome.');
      return;
    }

    const rec = new SpeechRecognition();
    const langConfig = LANGUAGES.find(l => l.code === language);
    rec.lang = langConfig?.code === 'en' ? 'en-IN' : `${langConfig?.code}-IN`;
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setInputText(transcript);
    };

    rec.onend = () => {
      setIsRecording(false);
      if (inputText.trim()) sendMessage();
    };

    rec.onerror = () => {
      setIsRecording(false);
    };

    setRecognition(rec);
    setIsRecording(true);
    rec.start();
  };

  const sendMessage = async (text = inputText) => {
    const msgText = text.trim();
    const hasImage = pendingImage !== null;
    
    if (!msgText && !hasImage) return;
    if (isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: msgText || (hasImage ? 'Please analyze this image' : ''),
      image: pendingImagePreview,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setPendingImage(null);
    setPendingImagePreview(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsLoading(true);

    try {
      let response;
      
      if (hasImage) {
        // Convert image to base64
        const reader = new FileReader();
        const fullDataUrl = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(pendingImage);
        });

        // Send to scan-document endpoint
        response = await fetch(`${API_BASE}/api/scan-document`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_base64: fullDataUrl,
            scan_type: 'scam'
          })
        });
        
        if (!response.ok) throw new Error('Scan failed');
        
        const data = await response.json();
        
        // Format the response based on verdict
        let content = '';
        if (data.verdict === 'suspicious') {
          content = `⚠ SUSPICIOUS - ${Math.round(data.confidence * 100)}% fraud probability\n\n`;
          content += 'Red flags found:\n';
          data.red_flags?.forEach((flag, i) => {
            content += `🚩 ${flag}\n`;
          });
          content += '\nSafe actions:\n';
          data.safe_actions?.forEach((action, i) => {
            content += `${i + 1}. ${action}\n`;
          });
        } else if (data.verdict === 'safe') {
          content = '✅ SAFE - No obvious scam indicators found.\n\n';
          content += 'The document appears to be genuine.';
        } else {
          content = '❓ UNVERIFIABLE - Could not determine authenticity.\n\n';
          content += 'Please consult official sources or visit nearest police station.';
        }
        
        content += '\n\n⚠ This is AI analysis only - not legal advice.';
        
        const aiResponse = {
          id: Date.now() + 1,
          role: 'ai',
          content: content,
          sources: data.sources_verified || ['RBI', 'cybercrime.gov.in'],
          verdict: data.verdict
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        // Send to chat endpoint (text only)
        const apiResponse = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: msgText,
            language: language,
            agent: 'general'
          })
        });
        
        if (!apiResponse.ok) throw new Error('API request failed');
        
        const data = await apiResponse.json();
        
        const aiResponse = {
          id: Date.now() + 1,
          role: 'ai',
          content: data.content || 'Sorry, I could not process your request.',
          sources: data.sources || ['AI JanMitra'],
          verdict: data.verdict,
          flags: data.flags
        };
        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error('Error:', error);
      
      // Fallback mock responses when backend unavailable
      let fallbackContent = '';
      
      if (hasImage) {
        fallbackContent = '📷 Image analysis requires backend connection.\n\n';
        fallbackContent += 'Please ensure the server is running on port 8000.\n\n';
        fallbackContent += 'Or use the Scanner page for document analysis.';
      } else if (msgText.toLowerCase().includes('rti')) {
        fallbackContent = language === 'hi' 
          ? '🔹 RTI दाखिल करने के लिए:\n\n1. rtionline.nic.in पर जाएं\n2. प्राधिकरण चुनें\n3. प्रश्न लिखें\n4. ₹10 शुल्क भुगतान करें\n\n⚠ यह मार्गदर्शन है, कानूनी सलाह नहीं।'
          : '🔹 To file RTI:\n\n1. Visit rtionline.nic.in\n2. Select Public Authority\n3. Write your question\n4. Pay ₹10 fee\n\n⚠ This is guidance only - not legal advice.';
      } else if (msgText.toLowerCase().includes('scam') || msgText.toLowerCase().includes('fraud')) {
        fallbackContent = '⚠ SUSPICIOUS - Likely a scam\n\n🚩 Official agencies never demand immediate UPI payment\n🚩 No reference number provided\n🚩 Threat language = classic scam tactic\n\nSafe: Call 1930 cyber helpline';
      } else if (msgText.toLowerCase().includes('scheme') || msgText.toLowerCase().includes('farmer')) {
        fallbackContent = language === 'hi'
          ? '🔹 आपके लिए योग्य schemes:\n\n1. PM Kisan - ₹6,000/year\n2. PM Awas Yojana - Free house\n3. Ayushman Bharat - ₹5 lakh health insurance\n\nज्यादा जानकारी के लिए पूछें।'
          : '🔹 Schemes you may qualify for:\n\n1. PM Kisan - ₹6,000/year\n2. PM Awas Yojana - Free house\n3. Ayushman Bharat - ₹5 lakh health insurance\n\nAsk for more details.';
      } else {
        fallbackContent = language === 'hi'
          ? 'नमस्ते! मैं AI JanMitra हूं। कानूनी मार्गदर्शन, सरकारी योजनाओं, या धोखाधड़ी की जांच में मदद कर सकता हूं।'
          : 'Hello! I am AI JanMitra. I can help with legal guidance, government schemes, or fraud detection.';
      }
      
      const errorMsg = {
        id: Date.now() + 1,
        role: 'ai',
        content: fallbackContent,
        sources: ['System (offline mode)']
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextareaChange = (e) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 90) + 'px';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="floating-widget">
      <button className="fab-button" onClick={toggleChat} title="Chat with JanMitra">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 3C7.03 3 3 6.58 3 11c0 2.1.9 4 2.4 5.4L4 21l4.8-1.5C10 20.2 11 20.4 12 20.4c4.97 0 9-3.58 9-8 0-4.42-4.03-8-9-8z" fill="white"/>
          <circle cx="9" cy="11" r="1" fill="#0D2240"/>
          <circle cx="12" cy="11" r="1" fill="#0D2240"/>
          <circle cx="15" cy="11" r="1" fill="#0D2240"/>
        </svg>
        <span className="fab-badge">J</span>
      </button>

      <div className={`chat-panel ${isOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <div className="panel-logo">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 7v6l7 5 7-5V7z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="10" cy="10" r="2" fill="white"/>
            </svg>
          </div>
          <div>
            <div className="panel-title">JanMitra AI</div>
            <div className="panel-subtitle">जन-मित्र · People's Friend</div>
          </div>
          <div className="panel-header-right">
            <select className="lang-select" value={language} onChange={handleLanguageChange}>
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
            <button className="panel-close" onClick={toggleChat}>×</button>
          </div>
        </div>

        <div className="panel-messages">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <div className="welcome-icon">🙏</div>
              <div className="welcome-title">नमस्ते! I'm JanMitra</div>
              <div className="welcome-subtitle">
                Ask me about laws, government schemes, or scan suspicious documents. Voice and image supported!
              </div>
              <div className="welcome-chips">
                {QUICK_CHIPS.map((chip, idx) => (
                  <button 
                    key={idx} 
                    className="welcome_chip"
                    onClick={() => handleChipClick(chip.msg)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`msg-row ${msg.role === 'user' ? 'user' : ''}`}>
                <div className={`msg-avatar ${msg.role}`}>
                  {msg.role === 'ai' ? 'J' : 'U'}
                </div>
                <div className={`msg-bubble ${msg.role}`}>
                  {msg.image && <img src={msg.image} alt="uploaded" className="msg-image" />}
                  <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                  {msg.sources && (
                    <div className="msg-sources">
                      {msg.sources.map((source, idx) => (
                        <span key={idx} className="msg-source">{source}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="msg-row">
              <div className="msg-avatar ai">J</div>
              <div className="typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className={`image-preview-bar ${pendingImagePreview ? 'show' : ''}`}>
          <img 
            src={pendingImagePreview || ''} 
            alt="preview" 
            className="image-thumb" 
          />
          <span className="image-label">Image attached - will be analyzed</span>
          <button className="image-clear" onClick={clearImage}>×</button>
        </div>

        <div className="panel-input-zone">
          <div className={`recording-banner ${isRecording ? 'show' : ''}`}>
            Recording... speak now
          </div>
          <div className="input-row">
            <button 
              className={`panel-icon-btn ${isRecording ? 'recording' : ''}`} 
              onClick={toggleVoice}
              title="Voice input"
            >
              🎤
            </button>
            <textarea
              ref={textareaRef}
              className="input-textarea"
              placeholder="सवाल पूछें... Ask anything"
              rows="1"
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
            />
            <input
              type="file"
              className="file-input"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              id="panel-file-input"
            />
            <label htmlFor="panel-file-input" className="panel-icon-btn" title="Attach image">
              📷
            </label>
            <button 
              className="panel-icon-btn panel-send-btn" 
              onClick={() => sendMessage()}
              title="Send"
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
