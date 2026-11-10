import React, { useState, useRef } from 'react';
import { UploadCloud, MapPin, Briefcase, User, BarChart3 } from 'lucide-react';

export default function JobSearchForm({ onSubmit, isSearching }) {
  const [title, setTitle] = useState('GenAI Engineer');
  const [location, setLocation] = useState('Bangalore');
  const [yoe, setYoe] = useState(5);
  const [jobLevel, setJobLevel] = useState('Senior');
  const [jobCount, setJobCount] = useState(10);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload a resume PDF");
      return;
    }
    const formData = new FormData();
    formData.append('job_title', title);
    formData.append('location', location);
    formData.append('yoe', yoe.toString());
    formData.append('job_level', jobLevel);
    formData.append('job_count', jobCount.toString());
    formData.append('resume', file);
    onSubmit(formData);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '20px', margin: '0 0 8px 0' }}>New Search</h2>

      <div>
        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Job Title / Keywords</label>
        <div style={{ position: 'relative' }}>
          <Briefcase size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-base"
            style={{ paddingLeft: '38px' }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isSearching}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Location</label>
        <div style={{ position: 'relative' }}>
          <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-base"
            style={{ paddingLeft: '38px' }}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            disabled={isSearching}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Years of Experience (YOE)</label>
        <div style={{ position: 'relative' }}>
          <User size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
          <input
            type="number"
            className="input-base"
            style={{ paddingLeft: '38px' }}
            value={yoe}
            onChange={(e) => setYoe(parseInt(e.target.value) || 0)}
            min="0"
            max="50"
            required
            disabled={isSearching}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Job Level</label>
        <div style={{ position: 'relative' }}>
          <BarChart3 size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
          <select
            className="input-base"
            style={{ paddingLeft: '38px' }}
            value={jobLevel}
            onChange={(e) => setJobLevel(e.target.value)}
            disabled={isSearching}
          >
            <option value="Intern">Intern</option>
            <option value="Entry Level">Entry Level</option>
            <option value="Associate">Associate</option>
            <option value="Mid Level">Mid Level</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
            <option value="Manager">Manager</option>
            <option value="Senior Manager">Senior Manager</option>
            <option value="Director">Director</option>
            <option value="VP">VP</option>
            <option value="CXO">CXO</option>
          </select>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Number of Jobs</label>
        <div style={{ position: 'relative' }}>
          <BarChart3 size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
          <input
            type="number"
            className="input-base"
            style={{ paddingLeft: '38px' }}
            value={jobCount}
            onChange={(e) => setJobCount(parseInt(e.target.value) || 1)}
            min="1"
            max="100"
            required
            disabled={isSearching}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Resume (PDF)</label>
        <div
          onClick={() => !isSearching && fileInputRef.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${file ? 'var(--accent-primary)' : 'var(--border-card)'}`,
            borderRadius: '8px',
            padding: '32px 16px',
            textAlign: 'center',
            cursor: isSearching ? 'not-allowed' : 'pointer',
            backgroundColor: file ? 'rgba(124, 58, 237, 0.05)' : 'rgba(0,0,0,0.2)',
            transition: 'all 0.2s'
          }}
        >
          <UploadCloud size={28} color={file ? 'var(--accent-primary)' : 'var(--text-muted)'} style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '14px', color: file ? 'var(--text-main)' : 'var(--text-muted)' }}>
            {file ? file.name : 'Drag & drop PDF or click to browse'}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && setFile(e.target.files[0])}
            accept="application/pdf"
            style={{ display: 'none' }}
            disabled={isSearching}
          />
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={isSearching || !file} style={{ marginTop: '12px' }}>
        {isSearching ? <span className="spinner"></span> : 'Start Multi-Agent Search'}
      </button>
    </form>
  );
}
