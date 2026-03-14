import { useState } from 'react';
import { Link } from 'react-router-dom';
import FloatingWidget from '../components/FloatingWidget';

const FILTERS = {
  states: ['Bihar', 'Uttar Pradesh', 'Maharashtra', 'Rajasthan', 'Tamil Nadu', 'West Bengal', 'Karnataka', 'Gujarat'],
  ages: ['18–30 years', '31–45', '46–60', '60+'],
  incomes: ['Below ₹1 lakh', '₹1–3 lakh', '₹3–6 lakh', 'Above ₹6 lakh'],
  categories: ['General', 'OBC', 'SC/ST', 'EWS'],
  genders: ['Female', 'Male', 'Other'],
  occupations: ['Farmer', 'Daily wage', 'Self-employed', 'Student', 'Business', 'Employee'],
};

const FILTER_CHIPS = ['All', 'Housing', 'Health', 'Agriculture', 'Finance', 'Education'];

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function SchemeFinder() {
  const [selectedFilters, setSelectedFilters] = useState({
    state: 'Bihar',
    age_group: '18–30 years',
    annual_income: 'Below ₹1 lakh',
    category: 'General',
    gender: 'Female',
    occupation: 'Farmer'
  });
  
  const [schemes, setSchemes] = useState([]);
  const [totalSchemes, setTotalSchemes] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeChip, setActiveChip] = useState('All');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);

  const handleFilterChange = (key, value) => {
    setSelectedFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyClick = (scheme) => {
    setSelectedScheme(scheme);
  };

  const filteredSchemes = schemes.filter(s => {
    if (activeChip === 'All') return true;
    return s.category === activeChip || (s.tags && s.tags.includes(activeChip));
  });

  const searchSchemes = async () => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(`${API_BASE}/api/schemes/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedFilters)
      });

      if (response.ok) {
        const data = await response.json();
        setSchemes(data.schemes || []);
        setTotalSchemes(data.total || 0);
      } else {
        throw new Error('Search failed');
      }
    } catch (err) {
      console.error('Scheme search error:', err);
      // Use mock data as fallback
      setSchemes([
        {
          name: 'PM Awas Yojana — Gramin',
          description: 'Free pucca house for rural BPL families. Directly transferred to bank account.',
          icon: '🏠',
          iconBg: '#E6F1FB',
          match: 92,
          amount: 'Up to ₹1.2L',
          tags: ['Central', 'Open now', 'Eligible'],
          tagTypes: ['central', 'open', 'eligible'],
        },
        {
          name: 'Ayushman Bharat — PM-JAY',
          description: '₹5 lakh health insurance at empanelled hospitals per year.',
          icon: '🏥',
          iconBg: '#FEF2F2',
          match: 88,
          amount: '₹5L/year',
          tags: ['Central', 'Eligible'],
          tagTypes: ['central', 'eligible'],
        },
        {
          name: 'PM Kisan Samman Nidhi',
          description: '₹6,000/year for small and marginal farmers in three direct instalments.',
          icon: '🌾',
          iconBg: '#E6F5ED',
          match: 95,
          amount: '₹6K/year',
          tags: ['Central', 'Next: Dec 2025'],
          tagTypes: ['central', 'closed'],
        }
      ]);
      setTotalSchemes(8);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '32px',
      background: '#E8E4DC'
    }}>
      <div className="scanner-page" style={{ width: '880px' }}>
        <div className="scheme-header">
          <div className="scheme-icon">🏛️</div>
          <div>
            <div className="scheme-title">JanSetu — Scheme Finder</div>
            <div className="scheme-subtitle">Discover every government benefit you're eligible for</div>
          </div>
          <div className="scheme-counter">
            <div className="scheme-count">{totalSchemes || 8}</div>
            <div className="scheme-count-label">Schemes matched</div>
          </div>
        </div>
        
        <div className="scheme-body">
          <div className="scheme-filters">
            <div className="filter-title">
              <span className="filter-icon">⚙</span>
              Your profile
            </div>
            
            <div className="filter-group">
              <div className="filter-label">State</div>
              <select 
                className="filter-select"
                value={selectedFilters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
              >
                {FILTERS.states.map(state => (
                  <option key={state}>{state}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <div className="filter-label">Age group</div>
              <select 
                className="filter-select"
                value={selectedFilters.age_group}
                onChange={(e) => handleFilterChange('age_group', e.target.value)}
              >
                {FILTERS.ages.map(age => (
                  <option key={age}>{age}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <div className="filter-label">Annual income</div>
              <select 
                className="filter-select"
                value={selectedFilters.annual_income}
                onChange={(e) => handleFilterChange('annual_income', e.target.value)}
              >
                {FILTERS.incomes.map(income => (
                  <option key={income}>{income}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <div className="filter-label">Category</div>
              <select 
                className="filter-select"
                value={selectedFilters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                {FILTERS.categories.map(cat => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <div className="filter-label">Gender</div>
              <select 
                className="filter-select"
                value={selectedFilters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
              >
                {FILTERS.genders.map(gender => (
                  <option key={gender}>{gender}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <div className="filter-label">Occupation</div>
              <select 
                className="filter-select"
                value={selectedFilters.occupation}
                onChange={(e) => handleFilterChange('occupation', e.target.value)}
              >
                {FILTERS.occupations.map(occ => (
                  <option key={occ}>{occ}</option>
                ))}
              </select>
            </div>
            
            <button 
              className="filter-btn" 
              onClick={searchSchemes}
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Find my schemes →'}
            </button>
            
            <div className="ai-tip">
              💬 Ask AI in Hindi: "Bihar के किसान को कौन सी schemes मिलती हैं?" — with voice!
            </div>
          </div>
          
          <div className="scheme-results">
            <div className="results-header">
              <div className="results-label">Matched schemes</div>
              <div className="results-filter">
                {selectedFilters.state} · {selectedFilters.occupation} · {selectedFilters.gender}
              </div>
            </div>
            
            <div className="filter-chips">
              {FILTER_CHIPS.map((chip, idx) => (
                <button 
                  key={idx} 
                  className={`filter-chip ${activeChip === chip ? 'active' : ''}`}
                  onClick={() => setActiveChip(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
            
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B7A8D' }}>
                Searching for schemes...
              </div>
            ) : (
              filteredSchemes.map((scheme, idx) => (
                <div key={idx} className="scheme-card">
                  <div className="scheme-card-header">
                    <div 
                      className="scheme-card-icon" 
                      style={{ 
                        background: scheme.iconBg || '#E6F1FB',
                        fontSize: '20px'
                      }}
                    >
                      {scheme.icon || '🏛️'}
                    </div>
                    <div className="scheme-card-content">
                      <div className="scheme-card-name">{scheme.name}</div>
                      <div className="scheme-card-desc">{scheme.description}</div>
                    </div>
                    <div className="scheme-card-match">
                      <div className="match-percent">{scheme.match_percentage || scheme.match}%</div>
                      <div className="match-label">Match</div>
                    </div>
                  </div>
                  
                  <div className="eligibility-bar">
                    <div className="eligibility-fill" style={{ width: `${scheme.match_percentage || scheme.match}%` }}></div>
                  </div>
                  
                  <div className="scheme-card-footer">
                    <div className="scheme-tags">
                      {(scheme.tags || ['Central']).map((tag, tagIdx) => (
                        <span 
                          key={tagIdx} 
                          className={`scheme-tag ${scheme.tagTypes?.[tagIdx] || 'central'}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="scheme-card-actions">
                      <span className="scheme-amount">{scheme.amount || 'Varies'}</span>
                      <button 
                        className="apply-btn"
                        onClick={() => handleApplyClick(scheme)}
                      >
                        How to apply →
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {!isLoading && hasSearched && filteredSchemes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B7A8D' }}>
                No schemes found matching the "{activeChip}" filter.
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedScheme && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setSelectedScheme(null)}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '500px',
            padding: '32px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ fontSize: '24px' }}>🏛️</div>
              <button onClick={() => setSelectedScheme(null)} style={{ fontSize: '24px', color: '#6B7A8D' }}>×</button>
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", marginBottom: '12px' }}>{selectedScheme.name}</h2>
            <p style={{ color: '#6B7A8D', marginBottom: '24px', fontSize: '14px', lineHeight: 1.6 }}>{selectedScheme.description}</p>
            
            <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>Benefit</span>
                <span style={{ color: '#0A7A2E', fontWeight: 600 }}>{selectedScheme.amount}</span>
              </div>
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', display: 'block', marginBottom: '8px' }}>Eligibility Details</span>
                {selectedScheme.eligibility && Object.entries(selectedScheme.eligibility).map(([key, val]) => (
                  <div key={key} style={{ fontSize: '12px', color: '#374151', marginBottom: '4px' }}>
                    • <strong>{key}:</strong> {val}
                  </div>
                ))}
              </div>
            </div>

            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Steps to Apply</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#0D2240', color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</div>
                <div style={{ fontSize: '12px' }}>Visit the official portal: <a href={selectedScheme.application_url} target="_blank" rel="noreferrer" style={{ color: '#E8600A', textDecoration: 'underline' }}>{selectedScheme.application_url || 'pmindia.gov.in'}</a></div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#0D2240', color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</div>
                <div style={{ fontSize: '12px' }}>Register using your Aadhaar number and mobile.</div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#0D2240', color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</div>
                <div style={{ fontSize: '12px' }}>Upload required documents (Income certificate, Residence proof).</div>
              </div>
            </div>

            <button 
              onClick={() => window.open(selectedScheme.application_url || 'https://www.myscheme.gov.in/', '_blank')}
              style={{
                width: '100%',
                padding: '14px',
                background: '#0D2240',
                color: 'white',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              Go to Official Application Portal ↗
            </button>
          </div>
        </div>
      )}
      
      <FloatingWidget />
    </div>
  );
}
