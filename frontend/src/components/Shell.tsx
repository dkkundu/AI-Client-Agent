import React from 'react';
import { useUIStore } from '../store/uiStore';
import { motion, AnimatePresence } from 'framer-motion';

import { Code2, Video, BrainCircuit, Settings } from 'lucide-react';
import DbConnectionModal from './DbConnectionModal';
import AuthModal from './AuthModal';
import UserProfile from './UserProfile';
import { useAuthStore } from '../store/authStore';
import './Shell.css';

// Lazy loaded components
const CodeAssistant = React.lazy(() => import('../pages/CodeAssistant').catch(() => ({ default: () => <div className="placeholder-view flex-center h-full"><h2>Code Assistant Module Error</h2></div> })));
const VideoStudio = React.lazy(() => import('../pages/VideoStudio').catch(() => ({ default: () => <div className="placeholder-view flex-center h-full"><h2>Video Studio Module Error</h2></div> })));
const KnowledgeBase = React.lazy(() => import('../pages/KnowledgeBase').catch(() => ({ default: () => <div className="placeholder-view flex-center h-full"><h2>Knowledge Base Module Error</h2></div> })));
const SettingsPage = React.lazy(() => import('../pages/Settings').catch(() => ({ default: () => <div className="placeholder-view flex-center h-full"><h2>Settings Module Error</h2></div> })));
const FileExplorer = React.lazy(() => import('./FileExplorer').catch(() => ({ default: () => <div className="p-4">Files Error</div> })));

export const Shell: React.FC = () => {
  const { activeModule, setActiveModule } = useUIStore();
  const { checkAuth } = useAuthStore();

  React.useEffect(() => { checkAuth(); }, [checkAuth]);

  const navItems = [
    { id: 'coding', icon: Code2, label: 'Code Assistant' },
    { id: 'video', icon: Video, label: 'Video Studio' },
    { id: 'knowledge', icon: BrainCircuit, label: 'Knowledge Base' },
  ] as const;

  const renderModule = () => {
    switch (activeModule) {
      case 'coding': return <CodeAssistant />;
      case 'video': return <VideoStudio />;
      case 'knowledge': return <KnowledgeBase />;
      case 'settings': return <SettingsPage />;
      default: return null;
    }
  };

  return (
    <div className="app-shell">
      <DbConnectionModal />
      <AuthModal />
      <div className="gradient-blob gradient-blob-1" />
      <div className="gradient-blob gradient-blob-2" />
      
      {/* Top Navigation */}
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">LLM</div>
          <span className="logo-text text-gradient">Client</span>
        </div>
        
        <nav className="top-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`nav-pill ${activeModule === item.id ? 'active' : ''}`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="header-actions">
          <button
            className={`btn btn-ghost toggle-btn ${activeModule === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveModule('settings')}
            title="Settings"
          >
            <Settings size={20} />
          </button>
          <UserProfile />
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="main-layout">
        {/* Sidebar (now just Workspace Files) */}
        {activeModule === 'coding' && (
          <aside className="app-sidebar">
             <React.Suspense fallback={<div className="loading-state">Loading Files...</div>}>
                <FileExplorer />
             </React.Suspense>
          </aside>
        )}

        {/* Content Area */}
        <main className="content-container">
          <div className="module-wrapper">
            <React.Suspense fallback={<div className="loading-view">Loading module...</div>}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeModule}
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.02, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{ height: '100%', width: '100%' }}
                >
                  {renderModule()}
                </motion.div>
              </AnimatePresence>
            </React.Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};
