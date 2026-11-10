import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Search, Star, Mail, Database,
  CheckCircle, AlertTriangle, Loader2, Clock, ChevronDown, ChevronUp
} from 'lucide-react';

const AGENT_CONFIG = {
  resume_agent: {
    label: 'Resume Agent',
    icon: FileText,
    color: '#6366f1',
    description: 'Parsing & extracting resume content',
  },
  job_search_agent: {
    label: 'Job Search Agent',
    icon: Search,
    color: '#8b5cf6',
    description: 'Scraping jobs from multiple platforms',
  },
  scoring_agent: {
    label: 'Scoring Agent',
    icon: Star,
    color: '#a855f7',
    description: 'AI-powered job-resume matching',
  },
  cover_letter_agent: {
    label: 'Cover Letter Agent',
    icon: Mail,
    color: '#c084fc',
    description: 'Generating personalized cover letters',
  },
  storage_agent: {
    label: 'Storage Agent',
    icon: Database,
    color: '#d946ef',
    description: 'Saving results to database & Excel',
  },
};

const NODE_ORDER = ['resume_agent', 'job_search_agent', 'scoring_agent', 'cover_letter_agent', 'storage_agent'];

function AgentStep({ nodeKey, agentState, isLast, index }) {
  const config = AGENT_CONFIG[nodeKey];
  const Icon = config.icon;
  const [expanded, setExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (agentState.status) {
      case 'running':
        return <Loader2 size={18} className="spin" style={{ color: config.color }} />;
      case 'done':
        return <CheckCircle size={18} style={{ color: '#22c55e' }} />;
      case 'error':
        return <AlertTriangle size={18} style={{ color: '#ef4444' }} />;
      case 'skipped':
        return <AlertTriangle size={18} style={{ color: '#f59e0b' }} />;
      default:
        return <Clock size={18} style={{ color: '#6b7280' }} />;
    }
  };

  const getStatusColor = () => {
    switch (agentState.status) {
      case 'running': return config.color;
      case 'done': return '#22c55e';
      case 'error': return '#ef4444';
      case 'skipped': return '#f59e0b';
      default: return '#374151';
    }
  };

  const hasDetails = agentState.details && Object.keys(agentState.details).length > 0;
  const hasIntermediateMessages = agentState.intermediateMessages && agentState.intermediateMessages.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      style={{ position: 'relative' }}
    >
      {/* Connector Line */}
      {!isLast && (
        <div style={{
          position: 'absolute',
          left: '23px',
          top: '52px',
          width: '2px',
          height: 'calc(100% - 20px)',
          background: agentState.status === 'done' ? '#22c55e' :
                     agentState.status === 'running' ? `linear-gradient(180deg, ${config.color}, #374151)` :
                     '#374151',
          zIndex: 0,
        }} />
      )}

      {/* Agent Card */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        background: agentState.status === 'running'
          ? `linear-gradient(135deg, rgba(${hexToRgb(config.color)}, 0.15), rgba(${hexToRgb(config.color)}, 0.05))`
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${agentState.status === 'running' ? config.color + '60' :
                              agentState.status === 'done' ? '#22c55e40' :
                              agentState.status === 'error' ? '#ef444440' :
                              'rgba(255,255,255,0.08)'}`,
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '12px',
        transition: 'all 0.3s ease',
        cursor: (hasDetails || hasIntermediateMessages) ? 'pointer' : 'default',
      }}
        onClick={() => (hasDetails || hasIntermediateMessages) && setExpanded(!expanded)}
      >
        {/* Pulse animation for running state */}
        {agentState.status === 'running' && (
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '16px',
              border: `2px solid ${config.color}`,
              pointerEvents: 'none',
            }}
          />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Icon Circle */}
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${config.color}20`,
            border: `2px solid ${agentState.status === 'running' ? config.color : 'transparent'}`,
            transition: 'all 0.3s',
            flexShrink: 0,
          }}>
            <Icon size={20} style={{ color: config.color }} />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, fontSize: '15px', color: '#f3f4f6' }}>
                {config.label}
              </span>
              {getStatusIcon()}
              {agentState.status === 'running' && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ fontSize: '12px', color: config.color, fontWeight: 500 }}
                >
                  Processing...
                </motion.span>
              )}
            </div>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>
              {agentState.message || config.description}
            </div>
          </div>

          {/* Expand Arrow */}
          {(hasDetails || hasIntermediateMessages) && (
            <div style={{ color: '#6b7280', flexShrink: 0 }}>
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          )}
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                marginTop: '14px',
                paddingTop: '14px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}>
                {/* Intermediate Messages */}
                {hasIntermediateMessages && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>
                      PROCESS LOG
                    </div>
                    {agentState.intermediateMessages.map((msg, i) => (
                      <div key={i} style={{
                        fontSize: '13px',
                        color: '#d1d5db',
                        padding: '6px 10px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '6px',
                        marginBottom: '4px',
                        fontFamily: 'monospace',
                      }}>
                        {msg}
                      </div>
                    ))}
                  </div>
                )}

                {/* Response Data */}
                {hasDetails && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>
                      RESPONSE DATA
                    </div>
                    <pre style={{
                      fontSize: '12px',
                      color: '#a5f3fc',
                      background: 'rgba(0,0,0,0.3)',
                      padding: '12px',
                      borderRadius: '8px',
                      overflow: 'auto',
                      maxHeight: '200px',
                      margin: 0,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      lineHeight: '1.5',
                    }}>
                      {JSON.stringify(agentState.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '99, 102, 241';
}

export default function LiveProcessFlow({ events, isSearching, activeNode }) {
  const scrollRef = useRef(null);
  const [agentStates, setAgentStates] = useState({});

  // Process events into agent states
  useEffect(() => {
    const states = {};

    // Initialize all agents as pending
    NODE_ORDER.forEach(node => {
      states[node] = {
        status: 'pending',
        message: '',
        details: {},
        intermediateMessages: [],
        startTime: null,
        endTime: null,
      };
    });

    // If search is active but no events yet, show the active node as running
    if (isSearching && events.length === 0 && activeNode) {
      states[activeNode] = {
        status: 'running',
        message: AGENT_CONFIG[activeNode]?.description || 'Starting...',
        details: {},
        intermediateMessages: [],
        startTime: new Date().toISOString(),
        endTime: null,
      };
    }

    // Process all events
    events.forEach(evt => {
      const node = evt.node;
      if (!node || node === '__done__' || node === '__error__') return;

      if (!states[node]) {
        states[node] = {
          status: 'pending',
          message: '',
          details: {},
          intermediateMessages: [],
          startTime: null,
          endTime: null,
        };
      }

      // Update status
      if (evt.status === 'running') {
        states[node].status = 'running';
        states[node].startTime = states[node].startTime || evt.timestamp;
        states[node].message = evt.message || '';
      } else if (evt.status === 'done') {
        states[node].status = 'done';
        states[node].endTime = evt.timestamp;
        states[node].message = evt.message || '';
        if (evt.data) {
          states[node].details = { ...states[node].details, ...evt.data };
        }
      } else if (evt.status === 'error') {
        states[node].status = 'error';
        states[node].endTime = evt.timestamp;
        states[node].message = evt.message || '';
      } else if (evt.status === 'skipped') {
        states[node].status = 'skipped';
        states[node].message = evt.message || '';
      } else if (evt.status === 'platform_success') {
        // Intermediate event from job search
        states[node].intermediateMessages.push(evt.message);
        if (evt.data) {
          if (!states[node].details.platforms) states[node].details.platforms = [];
          states[node].details.platforms.push(evt.data);
        }
      }
    });

    // Mark previous agents as done if a later one is running
    let foundRunning = false;
    for (let i = NODE_ORDER.length - 1; i >= 0; i--) {
      const node = NODE_ORDER[i];
      if (states[node].status === 'running') {
        foundRunning = true;
      } else if (foundRunning && states[node].status === 'pending') {
        // This shouldn't happen but handle gracefully
      }
    }

    setAgentStates(states);
  }, [events, isSearching, activeNode]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  // Count completed and total
  const completedCount = NODE_ORDER.filter(n => agentStates[n]?.status === 'done').length;
  const totalCount = NODE_ORDER.length;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600 }}>
            Live Process Flow
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
            Real-time view of the multi-agent pipeline
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isSearching && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 size={20} style={{ color: '#8b5cf6' }} />
            </motion.div>
          )}
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: completedCount === totalCount && totalCount > 0 ? '#22c55e' : '#8b5cf6',
          }}>
            {completedCount}/{totalCount}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '3px',
        background: 'rgba(255,255,255,0.05)',
        position: 'relative',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1, #a855f7, #d946ef)',
            borderRadius: '0 3px 3px 0',
          }}
        />
      </div>

      {/* Agent Steps */}
      <div ref={scrollRef} style={{
        padding: '20px 24px',
        maxHeight: '600px',
        overflowY: 'auto',
      }}>
        {NODE_ORDER.map((nodeKey, index) => (
          <AgentStep
            key={nodeKey}
            nodeKey={nodeKey}
            agentState={agentStates[nodeKey] || { status: 'pending', message: '', details: {}, intermediateMessages: [] }}
            isLast={index === NODE_ORDER.length - 1}
            index={index}
          />
        ))}

        {/* Empty State */}
        {events.length === 0 && !isSearching && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#6b7280',
          }}>
            <Search size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
              No active search
            </div>
            <div style={{ fontSize: '14px' }}>
              Start a multi-agent search to see the live process flow
            </div>
          </div>
        )}
      </div>
    </div>
  );
}