import React from 'react';
import { useUIStore } from '../store/uiStore';
import { Code2, Video, BrainCircuit, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import './Sidebar.css'; // Let's also create this

export const Sidebar: React.FC = () => {
  const { activeModule, setActiveModule, sidebarOpen, toggleSidebar } = useUIStore();

  const navItems = [
    { id: 'coding', icon: Code2, label: 'Code Assistant' },
    { id: 'video', icon: Video, label: 'Video Studio' },
    { id: 'knowledge', icon: BrainCircuit, label: 'Knowledge Base' },
  ] as const;

  return (
    <motion.aside 
      className="sidebar glass-panel"
      initial={false}
      animate={{ width: sidebarOpen ? 260 : 72 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="sidebar-header flex-between">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="logo-container"
            >
              <div className="logo-icon">LLM</div>
              <span className="logo-text text-gradient">Client</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button className="btn btn-ghost toggle-btn" onClick={toggleSidebar}>
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeModule === item.id ? 'active' : ''}`}
            onClick={() => setActiveModule(item.id)}
            title={!sidebarOpen ? item.label : undefined}
          >
            <item.icon size={22} className="nav-icon" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="nav-label"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
            {activeModule === item.id && (
              <motion.div layoutId="active-indicator" className="active-indicator" />
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className={`nav-item ${activeModule === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveModule('settings')}
          title={!sidebarOpen ? 'Settings' : undefined}
        >
          <Settings size={22} className="nav-icon" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="nav-label"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
};
