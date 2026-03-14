import { Link } from 'react-router-dom';
import FloatingWidget from '../components/FloatingWidget';

export default function Landing() {
  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 7v6l7 5 7-5V7z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="10" cy="10" r="2" fill="white"/>
            </svg>
          </div>
          <div>
            <div className="brand-name">AI JanMitra</div>
            <div className="brand-tag">जन-मित्र · People's Friend</div>
          </div>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#languages">Languages</a>
          <Link to="/chat">Chat</Link>
          <Link to="/scanner">Scanner</Link>
          <Link to="/schemes">Schemes</Link>
          <Link to="/login" className="login-nav-link" style={{ fontWeight: 600, color: '#D97742' }}>Sign In</Link>
        </div>
        <button className="nav-cta" onClick={() => document.querySelector('.fab-button')?.click()}>
          Try AI free →
        </button>
      </nav>

      <div className="hero">
        <div className="hero-geometry hero-geometry-1"></div>
        <div className="hero-geometry hero-geometry-2"></div>
        
        <div className="eyebrow">
          <div className="eyebrow-line"></div>
          <div className="eyebrow-text">Built for every Indian citizen</div>
        </div>
        
        <h1>Your trusted guide for <em>law, schemes</em> & digital safety</h1>
        <p className="hero-description">
          Understand legal notices, discover government benefits, and detect digital scams — in your own language, free.
        </p>
        
        <div className="hero-buttons">
          <button className="btn btn-primary" onClick={() => document.querySelector('.fab-button')?.click()}>
            Chat with JanMitra →
          </button>
          <Link to="/scanner" className="btn btn-outline">
            Scan a document
          </Link>
        </div>
        
        <div className="languages-supported">
          <span className="languages-label">8 languages</span>
          <span className="language-tag">हिंदी</span>
          <span className="language-tag">தமிழ்</span>
          <span className="language-tag">বাংলা</span>
          <span className="language-tag">తెలుగు</span>
          <span className="language-tag">मराठी</span>
          <span className="language-tag">ಕನ್ನಡ</span>
          <span className="language-tag">ગુજરાતી</span>
          <span className="language-tag">മലയാളം</span>
        </div>
      </div>

      <div className="agents-section" id="features">
        <div className="section-header">
          <div className="section-line"></div>
          <div className="section-label">Three intelligent agents</div>
        </div>
        <h2 className="section-title">One app. Every need.</h2>
        
        <div className="agents-grid">
          <div className="agent-card navy">
            <div className="agent-number">01</div>
            <div className="agent-icon">⚖️</div>
            <div className="agent-name">Nyaya-Mitra</div>
            <div className="agent-description">
              Plain-language law guidance. RTI drafts, BNS/BNSS explanations, complaint templates.
            </div>
            <Link to="/chat" className="agent-link">Legal guide →</Link>
          </div>
          
          <div className="agent-card saffron">
            <div className="agent-number">02</div>
            <div className="agent-icon">🏛️</div>
            <div className="agent-name">JanSetu</div>
            <div className="agent-description">
              Discover central and state schemes matched to your profile. Step-by-step guidance.
            </div>
            <Link to="/schemes" className="agent-link">Scheme finder →</Link>
          </div>
          
          <div className="agent-card green">
            <div className="agent-number">03</div>
            <div className="agent-icon">🛡️</div>
            <div className="agent-name">Suraksha-AI</div>
            <div className="agent-description">
              Detect fake notices, scam messages, and fraudulent documents before you act.
            </div>
            <Link to="/scanner" className="agent-link">Scam detector →</Link>
          </div>
        </div>
      </div>

      <div className="demo-section">
        <div className="section-header">
          <div className="section-line"></div>
          <div className="section-label">Live preview</div>
        </div>
        <h2 className="section-title" style={{ marginBottom: '22px' }}>See it working</h2>
        
        <div className="demo-frame">
          <div className="demo-browser-bar">
            <span className="demo-dot demo-dot-red"></span>
            <span className="demo-dot demo-dot-yellow"></span>
            <span className="demo-dot demo-dot-green"></span>
            <span className="demo-url">janmitra.app · Suraksha-AI</span>
          </div>
          <div className="demo-messages">
            <div className="message-row reverse">
              <div className="message-avatar" style={{ background: '#E6F1FB', color: '#0C447C' }}>R</div>
              <div className="message-bubble user">
                मुझे एक WhatsApp message आया — बिजली काट देंगे अगर ₹2,400 UPI नहीं किया। क्या यह सच है?
              </div>
            </div>
            <div className="message-row">
              <div className="message-avatar" style={{ background: '#0D2240', color: 'white', fontSize: '10px' }}>AI</div>
              <div className="message-bubble ai">
                <div className="verification-tag">⚠ Suspicious — likely a scam</div>
                <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.65' }}>
                  <strong style={{ color: '#0D2240' }}>3 red flags:</strong><br/>
                  🚩 DISCOM WhatsApp पर notice नहीं देता<br/>
                  🚩 UPI demand = classic scam<br/>
                  🚩 कोई reference number नहीं<br/><br/>
                  <strong style={{ color: '#0D2240' }}>Safe:</strong> 1930 helpline पर call करें
                </div>
                <div className="sources">
                  <span className="source-tag">RBI advisory</span>
                  <span className="source-tag">cybercrime.gov.in</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-item">
          <div className="stat-number">8<sup>+</sup></div>
          <div className="stat-label">Regional languages</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">500<sup>+</sup></div>
          <div className="stat-label">Schemes indexed</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">Free</div>
          <div className="stat-label">Always, for every citizen</div>
        </div>
      </div>

      <footer className="footer-bar">
        <p>© 2025 AI JanMitra — Open source, citizen-built</p>
        <p>Llama 3 · Supabase · FastAPI · Vercel</p>
      </footer>
      
      <div className="disclaimer">
        ⚠ AI JanMitra provides first-step guidance only — not legal advice.
      </div>

      <FloatingWidget />
    </div>
  );
}
