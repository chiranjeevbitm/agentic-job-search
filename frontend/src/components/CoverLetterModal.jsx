import React from 'react';
import { motion } from 'framer-motion';
import { X, Copy, CheckCircle } from 'lucide-react';

export default function CoverLetterModal({ letter, onClose }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '24px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-panel"
        style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>AI Generated Cover Letter</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleCopy} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {copied ? <CheckCircle size={16} color="var(--success)" /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={onClose} className="btn-ghost" style={{ padding: '8px' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ padding: '32px', overflowY: 'auto', fontSize: '15px', lineHeight: '1.8', color: 'rgba(255,255,255,0.9)', whiteSpace: 'pre-wrap' }}>
          {letter}
        </div>
      </motion.div>
    </div>
  );
}
