import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import JobSearchForm from '../components/JobSearchForm';
import JobCard from '../components/JobCard';
import StatsBar from '../components/StatsBar';
import LiveProcessFlow from '../components/LiveProcessFlow';
import CoverLetterModal from '../components/CoverLetterModal';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:8000/api';

export default function SearchPage() {
  const [searchId, setSearchId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [events, setEvents] = useState([]);
  const [results, setResults] = useState([]);
  const [activeNode, setActiveNode] = useState(null);
  const [error, setError] = useState(null);
  const [selectedLetter, setSelectedLetter] = useState(null);

  const eventSourceRef = useRef(null);

  const handleSearch = async (formData) => {
    setIsSearching(true);
    setEvents([]);
    setResults([]);
    setError(null);
    setActiveNode('resume_agent');

    try {
      const resp = await axios.post(`${API_BASE}/jobs/search`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const sid = resp.data.search_id;
      setSearchId(sid);
      connectSSE(sid);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
      setIsSearching(false);
    }
  };

  const connectSSE = (sid) => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    const es = new EventSource(`${API_BASE}/jobs/stream/${sid}`);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.node === '__done__') {
        es.close();
        setActiveNode(null);
        fetchResults(sid);
        return;
      }
      if (data.node === '__error__') {
        es.close();
        setError(data.message);
        setIsSearching(false);
        setActiveNode(null);
        return;
      }

      if (data.status === 'running') {
        setActiveNode(data.node);
      }

      if (data.message) {
        setEvents(prev => [...prev, data]);
      }
    };

    es.onerror = () => {
      es.close();
      setIsSearching(false);
      setActiveNode(null);
    };
  };

  const fetchResults = async (sid) => {
    try {
      console.log('Fetching results for search_id:', sid);
      console.log('API URL:', `${API_BASE}/jobs/results/${sid}`);
      const resp = await axios.get(`${API_BASE}/jobs/results/${sid}`);
      console.log('Results fetched successfully:', resp.data);
      console.log('Number of results:', resp.data.length);
      setResults(resp.data);
      console.log('Results set in state');
    } catch (err) {
      console.error('Failed to fetch results:', err.response?.data || err.message);
      console.error('Error status:', err.response?.status);
      console.error('Full error:', err);
      // Set empty results on error so UI doesn't hang
      setResults([]);
    } finally {
      setIsSearching(false);
      console.log('isSearching set to false');
    }
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  return (
    <div>
      {/* Main Content Area */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', margin: '0 0 12px 0' }}>Job Search</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', margin: 0 }}>
          Upload your resume and let our AI agents find the perfect matches for you.
        </p>
      </div>

      {/* Side-by-Side Layout: Form + Live Progress/Results (Always Visible) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Search Form - Left Side */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <JobSearchForm onSubmit={handleSearch} isSearching={isSearching} />
        </div>

        {/* Right Side: Live Progress OR Results Summary */}
        <div>
          {results.length > 0 ? (
            /* Results Summary on Right Side */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel"
              style={{ padding: '24px', height: '100%' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px' }}>Results ({results.length})</h3>
                <a
                  href={`${API_BASE}/jobs/download`}
                  className="btn-ghost"
                  style={{ textDecoration: 'none', fontSize: '12px' }}
                  target="_blank"
                  rel="noreferrer"
                >
                  ↓ Download XLSX
                </a>
              </div>
              <StatsBar results={results} />
              <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '16px' }}>
                {results.sort((a,b) => b.score - a.score).map((job, idx) => (
                  <div key={job.id || idx} style={{ 
                    padding: '12px', 
                    borderBottom: idx < results.length - 1 ? '1px solid var(--border-card)' : 'none',
                    fontSize: '13px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{job.job_title}</span>
                      <span style={{ 
                        fontWeight: 600, 
                        color: job.score >= 80 ? 'var(--success)' : job.score >= 60 ? 'var(--warning)' : 'var(--danger)' 
                      }}>
                        {job.score}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {job.company} • {job.location}
                      {job.is_suitable === 'Yes' && <span className="badge success" style={{ marginLeft: '8px' }}>Suitable</span>}
                    </div>
                    {job.cover_letter && (
                      <button
                        onClick={() => setSelectedLetter(job.cover_letter)}
                        style={{
                          marginTop: '8px',
                          padding: '4px 8px',
                          border: '1px solid var(--border-card)',
                          borderRadius: '4px',
                          background: 'rgba(124, 58, 237, 0.2)',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        View Cover Letter
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Live Process Flow on Right Side */
            <LiveProcessFlow events={events} isSearching={isSearching} activeNode={activeNode} />
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid #ef4444', 
            borderRadius: '8px', 
            padding: '16px', 
            marginBottom: '24px',
            color: '#fecaca'
          }}
        >
          <strong>Error:</strong> {error}
        </motion.div>
      )}

      {selectedLetter && (
        <CoverLetterModal
          letter={selectedLetter}
          onClose={() => setSelectedLetter(null)}
        />
      )}
    </div>
  );
}
