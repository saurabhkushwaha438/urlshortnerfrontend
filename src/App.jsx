import React, { useState } from 'react';
import './index.css';

const BACKEND_URL = 'https://urlshortener-api-pek6.onrender.com';

function App() {
  const [activeTab, setActiveTab] = useState('shorten'); // 'shorten' | 'analytics'

  return (
    <div className="card">
      <h1>URL Shortener</h1>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'shorten' ? 'active' : ''}`}
          onClick={() => setActiveTab('shorten')}
        >
          Shorten URL
        </button>
        <button 
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {activeTab === 'shorten' ? <ShortenForm /> : <AnalyticsForm />}
    </div>
  );
}

function ShortenForm() {
  const [longUrl, setLongUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!longUrl) return;

    // Basic URL validation
    try {
      new URL(longUrl);
    } catch (_) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setCopied(false);

    try {
      const response = await fetch(`/api/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ longUrl })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to shorten URL');
      }

      setResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      const shortUrl = `${BACKEND_URL}/${result.shortCode}`;
      navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="longUrl">Enter your long URL</label>
          <input 
            id="longUrl"
            type="url" 
            className="form-input" 
            placeholder="https://example.com/very-long-url"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading || !longUrl}>
          {loading ? <span className="loader"></span> : 'Shorten URL'}
        </button>
        {error && <div className="error-message">{error}</div>}
      </form>

      {result && (
        <div className="result-box">
          <div className="result-title">Your Shortened URL</div>
          <a 
            href={`${BACKEND_URL}/${result.shortCode}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="result-link"
          >
            {`${BACKEND_URL}/${result.shortCode}`}
          </a>
          <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}><polyline points="20 6 9 17 4 12"></polyline></svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                Copy Link
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function AnalyticsForm() {
  const [shortCode, setShortCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shortCode) return;

    // If user pastes full short URL, extract just the code
    let codeToFetch = shortCode;
    try {
      const urlObj = new URL(shortCode);
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        codeToFetch = parts[parts.length - 1];
      }
    } catch (_) {
      // Not a full URL, treat as code
    }

    // In case there is a trailing slash or something
    codeToFetch = codeToFetch.replace(/[^a-zA-Z0-9_-]/g, '');

    setLoading(true);
    setError('');
    setStats(null);

    try {
      const response = await fetch(`/api/stats/${codeToFetch}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Could not find stats for this link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="shortCode">Enter short URL or code</label>
          <input 
            id="shortCode"
            type="text" 
            className="form-input" 
            placeholder="e.g., l or http://.../l"
            value={shortCode}
            onChange={(e) => setShortCode(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading || !shortCode}>
          {loading ? <span className="loader"></span> : 'View Stats'}
        </button>
        {error && <div className="error-message">{error}</div>}
      </form>

      {stats && (
        <div className="stats-box">
          <div className="stats-number">{stats.clicks}</div>
          <div className="stats-label">Total Clicks</div>
        </div>
      )}
    </div>
  );
}

export default App;
