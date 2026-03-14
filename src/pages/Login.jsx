import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Authenticate with mock login logic since Supabase client isn't fully configured
        if (email.includes('@') && password.length >= 6) {
          localStorage.setItem('jm_user_auth', JSON.stringify({ email }));
          navigate('/');
        } else {
          setError('Invalid email or password');
        }
      } else {
        // Validate Aadhaar (must be 12 digits)
        const aadhaarRegex = /^\d{12}$/;
        if (!aadhaarRegex.test(aadhaar.replace(/\s/g, ''))) {
          setError('Please enter a valid 12-digit Aadhaar number');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        // Mock Registration
        localStorage.setItem('jm_user_auth', JSON.stringify({ email, aadhaar: aadhaar.replace(/\s/g, '') }));
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#E8E4DC',
      padding: '24px'
    }}>
      <div style={{
        background: '#fff',
        padding: '40px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', background: '#D97742', borderRadius: '12px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
            JM
          </div>
          <h2 style={{ fontFamily: 'DM Serif Display', fontSize: '28px', color: '#0D2240', margin: '0 0 8px 0' }}>
            {isLogin ? 'Sign in to JanMitra' : 'Create an Account'}
          </h2>
          <p style={{ color: '#6B7A8D', margin: 0, fontSize: '15px' }}>
            {isLogin ? 'Welcome back, citizen.' : 'Register with your Aadhaar secure identity.'}
          </p>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#3A4B62', marginBottom: '6px' }}>Aadhaar Number <span style={{ color: '#DC2626' }}>*</span></label>
              <input
                type="text"
                placeholder="XXXX XXXX XXXX"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value)}
                maxLength={14}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '15px' }}
                required
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#3A4B62', marginBottom: '6px' }}>Email Address <span style={{ color: '#DC2626' }}>*</span></label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '15px' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#3A4B62', marginBottom: '6px' }}>Password <span style={{ color: '#DC2626' }}>*</span></label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '15px' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: '#0D2240',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '8px'
            }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register securely')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#6B7A8D' }}>
          {isLogin ? "Don't have an account? " : "Already registered? "}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: '#D97742', fontWeight: '600', cursor: 'pointer', padding: 0 }}
          >
            {isLogin ? 'Create one' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
