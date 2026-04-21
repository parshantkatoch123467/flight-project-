import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (res.ok) {
        if (data.role !== 'admin') {
          setError('Access Denied: Insufficient Privileges. Admin Account Required.');
          setIsLoading(false);
          return;
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        
        // Open Admin Dashboard in a new tab
        window.open('/admin-dashboard', '_blank');
        
        // redirect current tab to home
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error: Unable to reach the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel admin-auth-card" style={{ maxWidth: '450px', width: '100%', padding: '3rem', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '2px solid rgba(168, 85, 247, 0.5)' }}>
            <span style={{ fontSize: '2.5rem' }}>🛡️</span>
          </div>
          <h2 style={{ color: '#fff', fontSize: '1.8rem', letterSpacing: '1px' }}>System Administrator</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Restricted Access Portal</p>
        </div>
        
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} style={{ position: 'relative', zIndex: 1 }}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Admin Email</label>
            <input 
              type="email" 
              className="form-control" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '1rem', borderRadius: '8px' }}
              placeholder="admin@system.local"
            />
          </div>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Security Key</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '1rem', borderRadius: '8px' }}
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            className="cta-button" 
            style={{ 
              width: '100%', 
              padding: '1rem', 
              fontSize: '1.1rem', 
              background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
              border: 'none',
              boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)',
              transition: 'all 0.3s ease'
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : 'Authorize & Launch Console'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
