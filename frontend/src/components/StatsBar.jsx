import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Target, Award } from 'lucide-react';

export default function StatsBar({ results }) {
  const totalJobs = results.length;
  const avgScore = totalJobs > 0 ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / totalJobs) : 0;
  const suitableJobs = results.filter(j => j.is_suitable === 'Yes').length;

  const statBoxes = [
    { label: 'Total Jobs Sent', value: totalJobs, icon: <Briefcase size={20} color="var(--accent-secondary)" /> },
    { label: 'Suitable Matches', value: suitableJobs, icon: <Target size={20} color="var(--success)" /> },
    { label: 'Avg Match Score', value: `${avgScore}%`, icon: <Award size={20} color="var(--warning)" /> },
  ];

  return (
    <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
      {statBoxes.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="glass-panel"
          style={{ flex: 1, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}
        >
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}>
            {stat.icon}
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{stat.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>{stat.value}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
