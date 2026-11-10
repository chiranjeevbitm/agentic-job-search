import React from 'react';
import { Settings, Server } from 'lucide-react';

export default function AgentCardDisplay({ agent }) {
  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', borderColor: agent.color ? `rgba(${hexToRgb(agent.color)}, 0.3)` : 'var(--border-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '28px', background: 'rgba(255,255,255,0.05)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
            {agent.icon}
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{agent.name}</h3>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>v{agent.version}</span>
          </div>
        </div>
        {agent.status === 'active' && <span className="badge success">Active</span>}
      </div>

      <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-muted)', marginBottom: '24px', flex: 1 }}>
        {agent.description}
      </p>

      <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '16px' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Settings size={12} /> Capabilities
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {agent.capabilities.map(cap => (
            <span key={cap} style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
              {cap}
            </span>
          ))}
        </div>

        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Server size={12} /> Registered Tools
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {agent.tools.map(tool => (
            <div key={tool} style={{ fontSize: '13px', background: 'rgba(15, 23, 42, 0.5)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--accent-secondary)' }}>@tool</span> {tool}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255,255,255';
}
