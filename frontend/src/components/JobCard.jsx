import React from 'react';
import { Building2, MapPin, ExternalLink, FileText, CheckCircle, XCircle } from 'lucide-react';
import ScoreGauge from './ScoreGauge';

export default function JobCard({ job, onViewLetter }) {
  const isSuitable = job.is_suitable === 'Yes';

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1, paddingRight: '12px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', lineHeight: '1.4' }}>{job.title}</h3>
          <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Building2 size={14} /> {job.company}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {job.location}</span>
          </div>
        </div>
        <ScoreGauge score={job.score} />
      </div>

      <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-muted)', flex: 1, marginBottom: '20px' }}>
        {job.match_reason}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-card)' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isSuitable ? (
            <span className="badge success"><CheckCircle size={14} style={{ marginRight: '4px' }}/> Suitable</span>
          ) : (
            <span className="badge danger"><XCircle size={14} style={{ marginRight: '4px' }}/> Not Suitable</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {job.url && (
            <a href={job.url} target="_blank" rel="noreferrer" className="btn-ghost" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              View <ExternalLink size={14} />
            </a>
          )}
          {job.cover_letter && isSuitable && (
            <button onClick={onViewLetter} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              <FileText size={14} /> Read Letter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
