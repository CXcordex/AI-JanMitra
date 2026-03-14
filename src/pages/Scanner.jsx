import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FloatingWidget from '../components/FloatingWidget';

const STEPS = [
  'Do not pay or call the number',
  'Report at cybercrime.gov.in',
  'Visit nearest police station',
  'Cyber helpline: 1930',
];

const REPORT_SITES = [
  { name: 'National Cyber Crime Reporting Portal', url: 'https://cybercrime.gov.in/', icon: '🛡️' },
  { name: 'RBI Kehta Hai - Fraud Awareness', url: 'https://rbikehtahai.rbi.org.in/', icon: '🏦' },
  { name: 'Sanchar Saathi - Report Phishing', url: 'https://sancharsaathi.gov.in/', icon: '📱' },
  { name: 'National Consumer Helpline', url: 'https://consumerhelpline.gov.in/', icon: '📞' },
];

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Scanner() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('scan'); // 'scan', 'history', 'report'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [verdict, setVerdict] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [redFlags, setRedFlags] = useState([]);
  const [sources, setSources] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const stored = localStorage.getItem('scanHistory');
      if (stored) {
        setScanHistory(JSON.parse(stored));
      } else {
        setScanHistory([]);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleHistoryItemClick = (item) => {
    setOcrText(item.ocr_text);
    setVerdict(item.verdict);
    setConfidence(item.confidence * 100);
    setRedFlags(item.red_flags_found || []);
    setSources(item.sources_verified || []);
    setActiveTab('scan');
  };

  const handleAskAI = () => {
    // Navigate to chat with the context of current scan
    const message = `I scanned a document and the verdict was ${verdict}. Here is the text: ${ocrText.substring(0, 500)}... Can you explain why it might be a scam?`;
    // We can't easily pass state through navigate for simple apps, so we'll just go to chat
    // In a real app, use context or state management
    navigate('/chat');
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    setIsAnalyzing(true);
    setError(null);
    setOcrText('');
    setVerdict(null);

    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const fullDataUrl = ev.target.result;
        
        try {
          const response = await fetch(`${API_BASE}/api/scan-document`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_base64: fullDataUrl,
              scan_type: 'scam'
            })
          });

          if (!response.ok) {
            throw new Error('Scan failed');
          }

          const data = await response.json();
          
          setOcrText(data.ocr_text || 'No text extracted');
          setVerdict(data.verdict);
          setConfidence(data.confidence * 100);
          setRedFlags(data.red_flags || []);
          setSources(data.sources_verified || []);
          
          const newHistoryItem = {
            id: Date.now(),
            created_at: new Date().toISOString(),
            ocr_text: data.ocr_text || 'No text extracted',
            verdict: data.verdict,
            confidence: data.confidence,
            red_flags_found: data.red_flags || [],
            sources_verified: data.sources_verified || []
          };
          
          try {
            const stored = localStorage.getItem('scanHistory');
            const history = stored ? JSON.parse(stored) : [];
            history.unshift(newHistoryItem);
            localStorage.setItem('scanHistory', JSON.stringify(history.slice(0, 50))); // Keep last 50
          } catch(e) {
            console.error("Localstorage save failed", e);
          }
          
        } catch (err) {
          console.error('Scan error:', err);
          setError('Could not connect to backend. Make sure server is running on port 8000.');
          // Use demo data as fallback
          setOcrText(`URGENT LEGAL NOTICE\nDistrict Court, Mumbai\nCase No: MC/2024/XXXX\nPay ₹85,000 within 48 hours\nUPI: court.fees@okicici`);
          setVerdict('suspicious');
          setConfidence(94);
          setRedFlags([
            'Real courts never request UPI payments',
            '"court.fees@okicici" is not a .gov.in domain',
            '48-hour arrest threat = psychological pressure tactic'
          ]);
          setSources(['cybercrime.gov.in', 'RBI']);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read file');
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error processing file');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const dt = new DataTransfer();
      dt.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dt.files;
        handleFileSelect({ target: { files: dt.files } });
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const getVerdictDisplay = () => {
    if (!verdict) return null;
    
    const colors = {
      suspicious: { bg: '#FEF2F2', text: '#7F1D1D', title: 'Suspicious' },
      safe: { bg: '#E6F5ED', text: '#0A4A1E', title: 'Safe' },
      unverifiable: { bg: '#FEFAF2', text: '#633806', title: 'Unverifiable' }
    };
    
    return colors[verdict] || colors.unverifiable;
  };

  const verdictStyle = getVerdictDisplay();

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '32px',
      background: '#E8E4DC'
    }}>
      <div className="scanner-page">
        <div className="page-header">
          <Link to="/" className="back-btn">←</Link>
          <div>
            <div className="page-title">Suraksha-AI — Document Scanner</div>
            <div className="page-subtitle">Upload suspicious notices or use AI chat to analyse with voice</div>
          </div>
          <div className="page-badge">
            <span className="page-badge-dot"></span>
            Live verification on
          </div>
        </div>
        
        <div className="scanner-tabs">
          <div 
            className={`scanner-tab ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => setActiveTab('scan')}
          >
            Scan document
          </div>
          <div 
            className={`scanner-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Scan history
          </div>
          <div 
            className={`scanner-tab ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            Report a scam
          </div>
        </div>
        
        <div className="scanner-body">
          {activeTab === 'scan' && (
            <div className="scanner-left">
              <div className="scanner-note">
                💬 <strong>Faster:</strong> Use JanMitra AI (bottom-right) → attach a photo of any document → get instant voice + text scam analysis
              </div>
              
              <div 
                className="upload-zone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: 'pointer' }}
              >
                <div className="upload-icon">📄</div>
                <div className="upload-title">
                  {isAnalyzing ? 'Analyzing document...' : 'Drop document here or click to upload'}
                </div>
                <div className="upload-subtitle">
                  Upload a photo of any suspicious notice or document
                </div>
                <div className="upload-formats">
                  <span className="format-tag">PDF</span>
                  <span className="format-tag">JPG</span>
                  <span className="format-tag">PNG</span>
                  <span className="format-tag">Screenshot</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
              
              {error && (
                <div style={{ 
                  padding: '12px', 
                  background: '#FEF2F2', 
                  borderRadius: '8px',
                  color: '#DC2626',
                  fontSize: '13px'
                }}>
                  {error}
                </div>
              )}
              
              {uploadedFile && (
                <div className="file-card">
                  <div className="file-icon">📋</div>
                  <div>
                    <div className="file-name">{uploadedFile.name}</div>
                    <div className="file-meta">{(uploadedFile.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <div className="file-status">
                    {isAnalyzing ? 'Analyzing...' : '✓ Complete'}
                  </div>
                </div>
              )}
              
              {ocrText && (
                <>
                  <div className="ocr-section">
                    <div className="ocr-header">
                      <div className="ocr-label">Extracted text (OCR)</div>
                      <div className="ocr-confidence">
                        <span className="ocr-dot"></span>
                        {Math.round(confidence)}% confidence
                      </div>
                    </div>
                    <div className="ocr-text">{ocrText}</div>
                  </div>
                  
                  <div>
                    <div className="red-flags-title">Red flags detected</div>
                    {redFlags.map((flag, idx) => (
                      <div 
                        key={idx} 
                        className={`red-flag ${verdict === 'suspicious' ? 'danger' : 'warning'}`}
                      >
                        <span className="red-flag-icon">
                          {verdict === 'suspicious' ? '🚩' : '⚠'}
                        </span>
                        <span className="red-flag-text">{flag}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="scanner-left">
              <div className="history-container">
                <div className="history-title">Your Recent Scans</div>
                {isLoadingHistory ? (
                  <div className="history-loading">Loading history...</div>
                ) : scanHistory.length > 0 ? (
                  <div className="history-grid">
                    {scanHistory.map((item) => (
                      <div 
                        key={item.id} 
                        className="history-card"
                        onClick={() => handleHistoryItemClick(item)}
                      >
                        <div className="history-verdict-badge" style={{
                          background: item.verdict === 'suspicious' ? '#FEF2F2' : '#E6F5ED',
                          color: item.verdict === 'suspicious' ? '#7F1D1D' : '#0A4A1E'
                        }}>
                          {item.verdict.toUpperCase()}
                        </div>
                        <div className="history-date">
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                        <div className="history-preview">
                          {item.ocr_text.substring(0, 80)}...
                        </div>
                        <div className="history-meta">
                          {item.red_flags_found?.length || 0} red flags found
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="history-empty">
                    <div className="empty-icon">📂</div>
                    <div className="empty-text">No scan history found</div>
                    <button className="empty-btn" onClick={() => setActiveTab('scan')}>
                      Scan your first document
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="scanner-left">
              <div className="report-container">
                <div className="report-header">
                  <div className="report-title">Official Reporting Channels</div>
                  <div className="report-subtitle">Report fraud and cybercrime to government authorities directly</div>
                </div>
                <div className="report-grid">
                  {REPORT_SITES.map((site) => (
                    <a 
                      key={site.name} 
                      href={site.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="report-site-card"
                    >
                      <div className="report-site-icon">{site.icon}</div>
                      <div className="report-site-content">
                        <div className="report-site-name">{site.name}</div>
                        <div className="report-site-action">Visit official portal ↗</div>
                      </div>
                    </a>
                  ))}
                </div>
                <div className="report-advisory">
                  <strong>Important:</strong> JanMitra is an AI assistant and cannot file police reports on your behalf. Please use the official links above to report crimes.
                </div>
              </div>
            </div>
          )}
          
          <div className="scanner-right">
            {verdictStyle ? (
              <div 
                className="verdict-card"
                style={{ background: verdictStyle.bg }}
              >
                <div className="verdict-label">Suraksha-AI verdict</div>
                <div 
                  className="verdict-title"
                  style={{ color: verdictStyle.text }}
                >
                  {verdictStyle.title}
                </div>
                <div className="verdict-subtitle">
                  {verdict === 'suspicious' 
                    ? 'High fraud probability. Do not make any payment.' 
                    : verdict === 'safe'
                    ? 'No obvious scam indicators found.'
                    : 'Could not verify. Please consult official sources.'}
                </div>
                <div className="verdict-confidence">
                  <span>Fraud probability</span>
                  <span>{Math.round(confidence)}%</span>
                </div>
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill" 
                    style={{ 
                      width: `${confidence}%`,
                      background: verdict === 'safe' ? '#0A7A2E' : '#DC2626'
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              <div 
                className="verdict-card"
                style={{ background: '#F5F3EE' }}
              >
                <div className="verdict-label" style={{ color: '#6B7A8D' }}>
                  Upload a document
                </div>
                <div 
                  className="verdict-title"
                  style={{ color: '#6B7A8D' }}
                >
                  Waiting...
                </div>
                <div className="verdict-subtitle">
                  Upload a suspicious notice to get AI analysis
                </div>
              </div>
            )}
            
            <div className="sources-card">
              <div className="sources-title">Sources cross-checked</div>
              {sources.length > 0 ? (
                sources.map((source, idx) => (
                  <div key={idx} className="source-item">
                    <span className="source-check">✓</span>
                    {source}
                  </div>
                ))
              ) : (
                <div className="source-item" style={{ opacity: 0.5 }}>
                  No sources verified yet
                </div>
              )}
            </div>
            
            <div className="steps-card">
              <div className="steps-title">Safe next steps</div>
              {STEPS.map((step, idx) => (
                <div key={idx} className="step-item">
                  <span className="step-number">{idx + 1}</span>
                  <span className="step-text">{step}</span>
                </div>
              ))}
            </div>
            
            <div className="action-buttons">
              <button 
                className="action-btn primary"
                onClick={handleAskAI}
                disabled={!verdict}
              >
                Ask AI more →
              </button>
              <button className="action-btn secondary">Share result</button>
            </div>
            
            <div className="scanner-disclaimer">
              ⚠ AI analysis only. Files deleted immediately after analysis.
            </div>
          </div>
        </div>
      </div>
      
      <FloatingWidget />
    </div>
  );
}
