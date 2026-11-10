import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Copy, Check, Filter, X, ChevronDown } from 'lucide-react';
import CoverLetterModal from '../components/CoverLetterModal';

const API_BASE = 'http://localhost:8000/api';

export default function HistoryPage() {
  const [history, setHistory] = useState({ results: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [copiedRow, setCopiedRow] = useState(null);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [selectedDescription, setSelectedDescription] = useState(null);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    job_level: '',
    is_suitable: '',
    company: '',
    min_score: '',
    max_score: '',
    search_id: '',
  });
  const [filterOptions, setFilterOptions] = useState({
    job_levels: [],
    companies: [],
    search_ids: [],
  });

  // Fetch filter options on mount
  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        const resp = await axios.get(`${API_BASE}/history/filters`);
        setFilterOptions(resp.data);
      } catch (err) {
        console.error('Failed to fetch filter options', err);
      }
    }
    fetchFilterOptions();
  }, []);

  // Fetch history when page or filters change
  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: '10',
        });
        
        if (filters.job_level) params.append('job_level', filters.job_level);
        if (filters.is_suitable) params.append('is_suitable', filters.is_suitable);
        if (filters.company) params.append('company', filters.company);
        if (filters.min_score) params.append('min_score', filters.min_score);
        if (filters.max_score) params.append('max_score', filters.max_score);
        if (filters.search_id) params.append('search_id', filters.search_id);
        
        const resp = await axios.get(`${API_BASE}/history?${params.toString()}`);
        setHistory(resp.data);
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [page, filters]);

  const copyRowToClipboard = (row) => {
    const rowData = [
      `Search Date: ${new Date(row.created_at).toLocaleDateString()}`,
      `Job Title: ${row.title}`,
      `Company: ${row.company}`,
      `Location: ${row.location || 'N/A'}`,
      `Score: ${row.score}`,
      `Is Suitable: ${row.is_suitable === 'Yes' ? 'Suitable' : 'Not Suitable'}`,
      `Match Reason: ${row.match_reason || 'N/A'}`,
      `Cover Letter: ${row.cover_letter ? 'Available' : 'Not Available'}`,
      `Job URL: ${row.url || 'N/A'}`,
      `Job Level: ${row.job_level || 'N/A'}`,
      `Years of Experience: ${row.yoe || 'N/A'}`,
      `Job Description: ${row.job_description ? row.job_description.substring(0, 500) + '...' : 'N/A'}`
    ].join('\n');

    navigator.clipboard.writeText(rowData).then(() => {
      setCopiedRow(row.id);
      setTimeout(() => setCopiedRow(null), 2000);
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filter changes
  };

  const clearFilters = () => {
    setFilters({
      job_level: '',
      is_suitable: '',
      company: '',
      min_score: '',
      max_score: '',
      search_id: '',
    });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '32px', margin: '0 0 12px 0' }}>Search History</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', margin: 0 }}>
            View and download previous AI matching sessions.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Total records: <strong style={{ color: 'white' }}>{history.total}</strong>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              border: '1px solid var(--border-card)',
              borderRadius: '8px',
              background: showFilters ? 'rgba(124, 58, 237, 0.3)' : 'rgba(0,0,0,0.2)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            <Filter size={16} />
            Filters
            {hasActiveFilters && (
              <span style={{
                background: 'var(--accent-secondary)',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 600
              }}>
                {Object.values(filters).filter(v => v !== '').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="glass-panel" style={{ marginBottom: '24px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Filter Jobs</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: '4px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: 'var(--danger)',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                <X size={12} />
                Clear All
              </button>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {/* Job Level Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Job Level
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={filters.job_level}
                  onChange={(e) => handleFilterChange('job_level', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 32px 8px 12px',
                    border: '1px solid var(--border-card)',
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,0.3)',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Levels</option>
                  {filterOptions.job_levels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Suitability Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Suitability
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={filters.is_suitable}
                  onChange={(e) => handleFilterChange('is_suitable', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 32px 8px 12px',
                    border: '1px solid var(--border-card)',
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,0.3)',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All</option>
                  <option value="Yes">Suitable</option>
                  <option value="No">Not Suitable</option>
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Company Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Company
              </label>
              <input
                type="text"
                placeholder="Search company..."
                value={filters.company}
                onChange={(e) => handleFilterChange('company', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-card)',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'var(--text-main)',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Min Score Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Min Score
              </label>
              <input
                type="number"
                placeholder="0"
                min="0"
                max="100"
                value={filters.min_score}
                onChange={(e) => handleFilterChange('min_score', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-card)',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'var(--text-main)',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Max Score Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Max Score
              </label>
              <input
                type="number"
                placeholder="100"
                min="0"
                max="100"
                value={filters.max_score}
                onChange={(e) => handleFilterChange('max_score', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-card)',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'var(--text-main)',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Search ID Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Search Session
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={filters.search_id}
                  onChange={(e) => handleFilterChange('search_id', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 32px 8px 12px',
                    border: '1px solid var(--border-card)',
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,0.3)',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Sessions</option>
                  {filterOptions.search_ids.map(id => (
                    <option key={id} value={id}>{id.substring(0, 8)}...</option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {/* Scrollable container for the table */}
        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
              <table style={{ minWidth: '1400px', width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '16px', borderBottom: '1px solid var(--border-card)', fontWeight: 500, minWidth: '60px' }}>S.No</th>
                    <th style={{ padding: '16px', borderBottom: '1px solid var(--border-card)', fontWeight: 500, minWidth: '120px' }}>Search Date</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-card)', fontWeight: 500, minWidth: '200px' }}>Job Title</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-card)', fontWeight: 500, minWidth: '150px' }}>Company</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-card)', fontWeight: 500, minWidth: '120px' }}>Location</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-card)', fontWeight: 500, minWidth: '80px' }}>Score</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-card)', fontWeight: 500, minWidth: '120px' }}>Is Suitable</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-card)', fontWeight: 500, minWidth: '100px' }}>Job Level</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-card)', fontWeight: 500, minWidth: '120px' }}>YoE</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-card)', fontWeight: 500, minWidth: '200px' }}>Match Reason</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-card)', fontWeight: 500, minWidth: '100px' }}>Job Description</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-card)', fontWeight: 500, minWidth: '150px' }}>Cover Letter</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-card)', fontWeight: 500, minWidth: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.results.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: i === history.results.length - 1 ? 'none' : '1px solid var(--border-card)', transition: 'background 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '16px', color: 'var(--text-muted)', textAlign: 'center' }}>{(page - 1) * 10 + i + 1}</td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Date(row.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '16px', fontWeight: 500 }}>
                    {row.url ? <a href={row.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-secondary)', textDecoration: 'none' }}>{row.title}</a> : row.title}
                  </td>
                  <td style={{ padding: '16px' }}>{row.company}</td>
                  <td style={{ padding: '16px' }}>{row.location || 'N/A'}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ fontWeight: 600, color: getScoreColor(row.score) }}>
                      {row.score}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {row.is_suitable === 'Yes' ? <span className="badge success">Suitable</span> : <span className="badge danger">Not Suitable</span>}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {row.job_level ? (
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        background: 'rgba(124, 58, 237, 0.2)', 
                        fontSize: '12px',
                        fontWeight: 500
                      }}>
                        {row.job_level}
                      </span>
                    ) : 'N/A'}
                  </td>
                  <td style={{ padding: '16px', fontSize: '12px' }}>{row.yoe || 'N/A'}</td>
                  <td style={{ padding: '16px', maxWidth: '300px', whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '13px', lineHeight: '1.4' }}>{row.match_reason || 'N/A'}</td>
                  <td style={{ padding: '16px' }}>
                    {row.job_description ? (
                      <button
                        onClick={() => setSelectedDescription(row.job_description)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid var(--border-card)',
                          borderRadius: '6px',
                          background: 'rgba(34, 197, 94, 0.2)',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(34, 197, 94, 0.4)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(34, 197, 94, 0.2)'}
                      >
                        View JD
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No JD</span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {row.cover_letter ? (
                      <button
                        onClick={() => setSelectedLetter(row.cover_letter)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid var(--border-card)',
                          borderRadius: '6px',
                          background: 'rgba(124, 58, 237, 0.2)',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(124, 58, 237, 0.4)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(124, 58, 237, 0.2)'}
                      >
                        View
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>None</span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {row.url && (
                        <a 
                          href={row.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ 
                            padding: '6px 12px',
                            border: '1px solid var(--border-card)',
                            borderRadius: '6px',
                            background: 'rgba(0,0,0,0.2)',
                            color: 'var(--accent-secondary)',
                            textDecoration: 'none',
                            fontSize: '12px',
                            transition: 'all 0.2s'
                          }}
                        >
                          Job Link
                        </a>
                      )}
                      <button
                        onClick={() => copyRowToClipboard(row)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          border: '1px solid var(--border-card)',
                          borderRadius: '6px',
                          background: 'rgba(0,0,0,0.2)',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(124, 58, 237, 0.2)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.2)'}
                      >
                        {copiedRow === row.id ? (
                          <>
                            <Check size={12} />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {history.results.length === 0 && !loading && (
                <tr>
                  <td colSpan={12} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {hasActiveFilters ? 'No jobs match your filters. Try adjusting them.' : 'No historical data found.'}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={12} style={{ padding: '32px', textAlign: 'center' }}><span className="spinner" style={{ display: 'inline-block' }}></span></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {history.total > 10 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
          <button className="btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
            Page {page} of {Math.ceil(history.total / 10)}
          </span>
          <button className="btn-ghost" disabled={page * 10 >= history.total} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}

      {/* Job Description Modal */}
      {selectedDescription && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setSelectedDescription(null)}
        >
          <div 
            className="glass-panel"
            style={{
              maxWidth: '800px',
              maxHeight: '80vh',
              width: '100%',
              overflow: 'auto',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Job Description</h3>
              <button
                onClick={() => setSelectedDescription(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              lineHeight: '1.6',
              color: 'var(--text-main)',
              fontSize: '14px'
            }}>
              {selectedDescription}
            </div>
          </div>
        </div>
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