import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Bot, LineChart, History } from 'lucide-react';

import SearchPage from './pages/SearchPage';
import AgentsPage from './pages/AgentsPage';
import HistoryPage from './pages/HistoryPage';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="app-header">
          <div className="app-logo">
            jobAI.
          </div>
          <nav className="nav-links">
            <NavLink
              to="/"
              className={({ isActive }) => isActive ? 'active' : ''}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Bot size={18} /> Search
            </NavLink>
            <NavLink
              to="/agents"
              className={({ isActive }) => isActive ? 'active' : ''}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LineChart size={18} /> Agents Dashboard
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) => isActive ? 'active' : ''}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <History size={18} /> History
            </NavLink>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
