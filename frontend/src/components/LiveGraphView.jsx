import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  { id: 'resume_agent', position: { x: 50, y: 50 }, data: { label: '📄 Resume Agent' } },
  { id: 'job_search_agent', position: { x: 250, y: 50 }, data: { label: '🔍 Job Search Agent' } },
  { id: 'scoring_agent', position: { x: 450, y: 50 }, data: { label: '⭐ Scoring Agent (Parallel)' } },
  { id: 'cover_letter_agent', position: { x: 450, y: 150 }, data: { label: '✉️ Cover Letter Agent' } },
  { id: 'storage_agent', position: { x: 450, y: 250 }, data: { label: '💾 Storage Agent\n(XLSX + DB)' } },
];

const initialEdges = [
  { id: 'e1', source: 'resume_agent', target: 'job_search_agent' },
  { id: 'e2', source: 'job_search_agent', target: 'scoring_agent' },
  { id: 'e3', source: 'scoring_agent', target: 'cover_letter_agent', label: 'score ≥ 60' },
  { id: 'e3b', source: 'scoring_agent', target: 'storage_agent', label: 'no suitable', style: { strokeDasharray: '4 4' }, type: 'step' },
  { id: 'e4', source: 'cover_letter_agent', target: 'storage_agent' },
];

export default function LiveGraphView({ activeNode }) {
  const nodes = useMemo(() => initialNodes.map(node => {
    const isActive = node.id === activeNode;
    return {
      ...node,
      style: {
        background: isActive ? 'rgba(124, 58, 237, 0.2)' : 'rgba(15, 23, 42, 0.8)',
        color: 'white',
        border: isActive ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '12px 16px',
        width: 180,
        fontWeight: 600,
        boxShadow: isActive ? '0 0 15px rgba(124, 58, 237, 0.4)' : 'none',
        transition: 'all 0.3s ease',
        animation: isActive ? 'pulse-ring 2s infinite' : 'none',
      }
    };
  }), [activeNode]);

  const edges = useMemo(() => initialEdges.map(edge => {
    // If we're at resume_agent or job_search_agent, animate the forward edge
    let animated = false;
    let stroke = 'rgba(255,255,255,0.2)';

    if (activeNode === 'resume_agent' && edge.id === 'e1') animated = true;
    if (activeNode === 'job_search_agent' && edge.id === 'e2') animated = true;
    if (activeNode === 'scoring_agent' && (edge.id === 'e3' || edge.id === 'e3b')) animated = true;
    if (activeNode === 'cover_letter_agent' && edge.id === 'e4') animated = true;

    if (animated) {
      stroke = '#06b6d4';
    }

    return {
      ...edge,
      animated,
      style: { ...edge.style, stroke, strokeWidth: animated ? 2 : 1 },
      labelStyle: { fill: '#94a3b8', fontSize: 11 }
    };
  }), [activeNode]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#334155" gap={24} size={2} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}
