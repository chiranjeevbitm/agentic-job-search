import React from 'react';
import { motion } from 'framer-motion';

export default function ScoreGauge({ score }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = 'var(--success)';
  if (score < 60) color = 'var(--danger)';
  else if (score < 80) color = 'var(--warning)';

  return (
    <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6"
        />
        <motion.circle
          cx="30"
          cy="30"
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <span style={{ position: 'absolute', fontWeight: 700, fontSize: '14px', color }}>
        {score}
      </span>
    </div>
  );
}
