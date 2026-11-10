import React, { useEffect, useRef } from 'react';
import { Bot, CheckCircle, AlertTriangle, PlayCircle } from 'lucide-react';

export default function AgentPipelineFeed({ events }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const getIcon = (status) => {
    if (status === 'done') return <CheckCircle size={16} color="var(--success)" />;
    if (status === 'error') return <AlertTriangle size={16} color="var(--danger)" />;
    if (status === 'running') return <PlayCircle size={16} color="var(--accent-secondary)" />;
    return <Bot size={16} color="var(--text-muted)" />;
  };

  return (
    <div className="glass-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-card)' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>Agent Activity Log</h3>
      </div>

      <div ref={scrollRef} style={{ maxHeight: '250px', overflowY: 'auto', padding: '16px 24px' }}>
        {events.map((evt, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '50%' }}>
              {getIcon(evt.status)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <strong style={{ fontSize: '14px', textTransform: 'capitalize' }}>
                  {evt.node.replace(/_/g, ' ')}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
                {evt.status === 'done' && <span className="badge success">Completed</span>}
                {evt.status === 'error' && <span className="badge danger">Failed</span>}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                {evt.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
