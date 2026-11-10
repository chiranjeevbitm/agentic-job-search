import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import AgentCardDisplay from '../components/AgentCardDisplay';

const API_BASE = 'http://localhost:8000/api';

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const resp = await axios.get(`${API_BASE}/agents`);
        setAgents(resp.data.agents);
      } catch (err) {
        console.error('Failed to fetch agents', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><span className="spinner" style={{ display: 'inline-block' }}></span></div>;

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', margin: '0 0 12px 0' }}>Agent Registry</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '600px', lineHeight: '1.5' }}>
          Explore the specialized AI agents that power the LangGraph orchestration pipeline. Each agent exposes specific capabilities and tools through the Agent-to-Agent protocol.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {agents.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <AgentCardDisplay agent={agent} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
