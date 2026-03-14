import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FloatingWidget from '../components/FloatingWidget';

const AGENTS = [
  { id: 'nyaya', name: 'Nyaya-Mitra', sub: 'Legal guidance', color: '#378ADD', icon: '⚖️' },
  { id: 'suraksha', name: 'Suraksha-AI', sub: 'Scam detector', color: '#1D9E75', icon: '🛡️' },
  { id: 'jansetu', name: 'JanSetu', sub: 'Scheme finder', color: '#E8600A', icon: '🏛️' },
];

const QUICK_CHIPS = [
  { label: '🏛 Check scheme eligibility', msg: 'Which government schemes am I eligible for?' },
  { label: '📝 Draft RTI', msg: 'Help me draft an RTI application for my local road repairs.' },
  { label: '📄 Scan document', msg: 'Please analyze this document for any scam indicators.' },
];

const LANGUAGES = [
  { code: 'hi', label: 'हिंदी' },
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'bn', label: 'বাংলা' },
];

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'ai',
      content: 'नमस्ते! मैं जन-मित्र हूँ। मैं आपकी कानूनी सहायता, सरकारी योजनाओं को खोजने और धोखाधड़ी से बचने में मदद कर सकता हूँ। मैं आज आपकी क्या सहायता कर सकता हूँ?',
      agent: 'nyaya'
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState('nyaya');
  const [language, setLanguage] = useState('hi');
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingImagePreview, setPendingImagePreview] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSpeak = (text, lang) => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    
    // Clean text: remove markdown symbols (*, _, #, etc) so it doesn't read 'asterisk asterisk'
    const cleanText = text.replace(/[*_#`~]+/g, '').replace(/\[.*?\]\(.*?\)/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const langMap = {
      'hi': 'hi-IN',
      'en': 'en-IN',
      'ta': 'ta-IN',
      'bn': 'bn-IN'
    };
    
    const targetLang = langMap[lang] || 'hi-IN';
    utterance.lang = targetLang;
    
    // Tweak properties to sound more human
    utterance.rate = 0.95;
    utterance.pitch = 1.05; 
    
    // Attempt to load the best premium voice for the accent
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // 1. Try to find a premium Microsoft/Google voice for the exact locale
      let bestVoice = voices.find(v => 
        (v.lang === targetLang || v.lang.replace('_', '-') === targetLang) && 
        (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Natural'))
      );
      
      // 2. Fallback to any voice matching the exact locale perfectly
      if (!bestVoice) {
         bestVoice = voices.find(v => v.lang === targetLang || v.lang.replace('_', '-') === targetLang);
      }
      
      // 3. Fallback to any generic language voice (e.g. 'bn-BD' if 'bn-IN' fails)
      if (!bestVoice) {
         bestVoice = voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
      }
      
      if (bestVoice) {
         utterance.voice = bestVoice;
      }
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Pre-load voices on mount to bypass Chrome's empty array bug
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const handleSendMessage = async (text = inputText) => {
    const msgText = text.trim();
    const hasImage = pendingImage !== null;
    
    if (!msgText && !hasImage) return;
    if (isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: msgText || 'Please analyze this image',
      image: pendingImagePreview,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setPendingImage(null);
    setPendingImagePreview(null);
    setIsLoading(true);

    try {
      let response;
      if (hasImage) {
        const fullDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(pendingImage);
        });

        response = await fetch(`${API_BASE}/api/scan-document`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_base64: fullDataUrl,
            scan_type: 'general',
            language: language
          })
        });
      } else {
        response = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: msgText,
            language: language,
            agent: activeAgent
          })
        });
      }

      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();

      const aiResponse = {
        id: Date.now() + 1,
        role: 'ai',
        content: data.content || data.ocr_text || 'Sorry, I encountered an error.',
        agent: data.agent || activeAgent,
        sources: data.sources || data.sources_verified,
        verdict: data.verdict,
        red_flags: data.red_flags,
        disclaimer: data.disclaimer,
        reasoning: data.reasoning
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        content: 'I am having trouble connecting to the server. Please check if the backend is running.',
        agent: activeAgent
      }]);
    } finally {
      setIsLoading(false);
    }
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
  };

  const getVerdictBadge = (verdict) => {
    if (!verdict) return null;
    const styles = {
      suspicious: { bg: '#FEF2F2', color: '#991B1B', label: '⚠ Suspicious' },
      safe: { bg: '#E6F5ED', color: '#0A4A1E', label: '✅ Safe' },
      unverifiable: { bg: '#FEFAF2', color: '#633806', label: '❓ Unverifiable' }
    };
    const style = styles[verdict] || styles.unverifiable;
    return (
      <div className="verification-tag" style={{ background: style.bg, color: style.color }}>
        {style.label}
      </div>
    );
  };

  const currentAgent = AGENTS.find(a => a.id === activeAgent) || AGENTS[0];

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '32px',
      background: '#E8E4DC'
    }}>
      <div className="chat-shell">
        <div className="sidebar">
          <div className="sidebar-top">
            <Link to="/" className="sidebar-brand">
              <div className="sidebar-brand-icon">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L3 7v6l7 5 7-5V7z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                  <circle cx="10" cy="10" r="2" fill="white"/>
                </svg>
              </div>
              <div>
                <div className="sidebar-brand-name">JanMitra</div>
                <div className="sidebar-brand-tag">जन-मित्र</div>
              </div>
            </Link>
            <button className="new-chat-btn" onClick={() => setMessages([messages[0]])}>
              <span className="plus-icon">+</span>
              New AI conversation
            </button>
          </div>
          
          <div className="sidebar-section-title">Agents</div>
          {AGENTS.map(agent => (
            <div 
              key={agent.id} 
              className={`agent-item ${activeAgent === agent.id ? 'active' : ''}`}
              onClick={() => setActiveAgent(agent.id)}
            >
              <div className="agent-dot" style={{ background: agent.color }}></div>
              <div>
                <div className="agent-item-name">{agent.name}</div>
                <div className="agent-item-sub">{agent.sub}</div>
              </div>
            </div>
          ))}
          
          <div className="sidebar-bottom">
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>
              Language
            </div>
            <select 
              className="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="chat-main">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className={`agent-badge ${activeAgent}`}>
                {currentAgent.icon} {currentAgent.name}
              </div>
              <div style={{ fontSize: '11px', color: '#6B7A8D' }}>{currentAgent.sub}</div>
            </div>
            <div className="header-status">
              <span className="status-dot"></span>
              Real-time Indian Law & Scheme Database
            </div>
          </div>
          
          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message-row ${msg.role === 'user' ? 'reverse' : ''}`}>
                <div 
                  className="message-avatar" 
                  style={{ 
                    background: msg.role === 'user' ? '#E6F1FB' : currentAgent.color,
                    color: 'white',
                    fontFamily: msg.role === 'ai' ? "'DM Serif Display', serif" : 'inherit'
                  }}
                >
                  {msg.role === 'user' ? 'U' : 'J'}
                </div>
                <div className={`message-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  {msg.image && (
                    <img 
                      src={msg.image} 
                      alt="Uploaded" 
                      style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '8px' }} 
                    />
                  )}
                  {msg.verdict && getVerdictBadge(msg.verdict)}
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  
                  {msg.role === 'ai' && (
                    <button 
                      onClick={() => handleSpeak(msg.content, language)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        cursor: 'pointer', 
                        fontSize: '16px', 
                        padding: '4px',
                        marginTop: '8px',
                        opacity: 0.7 
                      }}
                      title="Listen to response"
                    >
                      🔊
                    </button>
                  )}
                  
                  {msg.red_flags && msg.red_flags.length > 0 && (
                    <ul className="flag-list">
                      {msg.red_flags.map((flag, idx) => (
                        <li key={idx}>🚩 {flag}</li>
                      ))}
                    </ul>
                  )}
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="message-sources">
                      {msg.sources.map((source, idx) => (
                        <span key={idx} className="source-tag">{source}</span>
                      ))}
                    </div>
                  )}
                  
                  {msg.role === 'ai' && (
                    <div className="message-disclaimer">
                      {msg.disclaimer || "⚠ This is AI guidance only. Always verify with official sources."}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-row">
                <div className="message-avatar" style={{ background: '#CCC' }}>J</div>
                <div className="message-bubble ai" style={{ color: '#6B7A8D' }}>Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chat-input-zone">
            {pendingImagePreview && (
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '8px' }}>
                <img src={pendingImagePreview} alt="Preview" style={{ height: '60px', borderRadius: '8px' }} />
                <button 
                  onClick={() => { setPendingImage(null); setPendingImagePreview(null); }}
                  style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px' }}
                >
                  ×
                </button>
              </div>
            )}
            <div className="chat-input-row">
              <button className="chat-icon-btn" title="Voice">🎤</button>
              <textarea 
                className="chat-textarea" 
                placeholder={`Ask ${currentAgent.name} anything...`} 
                rows="1"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              ></textarea>
              <button 
                className="chat-icon-btn" 
                title="Image"
                onClick={() => fileInputRef.current?.click()}
              >
                📷
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleImageUpload}
              />
              <button 
                className={`chat-icon-btn send ${!inputText.trim() && !pendingImage ? 'disabled' : ''}`}
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() && !pendingImage}
              >
                ↑
              </button>
            </div>
            <div className="quick-chips">
              {QUICK_CHIPS.map((chip, idx) => (
                <button 
                  key={idx} 
                  className="quick-chip"
                  onClick={() => handleSendMessage(chip.msg)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <FloatingWidget />
    </div>
  );
}
