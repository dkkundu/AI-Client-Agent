import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useDbStore } from '../store/dbStore';
import './AuthModal.css';

export default function AuthModal() {
  const { isConnected } = useDbStore();
  const { user, isChecking, login, register } = useAuthStore();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearForm = () => { setName(''); setEmail(''); setPassword(''); setConfirm(''); setError(null); };

  const switchTab = (t: 'login' | 'register') => { setTab(t); clearForm(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (tab === 'register' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const err = tab === 'login'
      ? await login(email, password)
      : await register(name, email, password);
    setLoading(false);
    if (err) setError(err);
  };

  if (!isConnected || isChecking || user) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="auth-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <motion.div
          className="auth-modal"
          initial={{ scale: 0.9, y: 40, rotateX: 8 }}
          animate={{ scale: 1, y: 0, rotateX: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          {/* Decorative orbs */}
          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
          <div className="auth-orb auth-orb-3" />

          {/* Avatar icon */}
          <div className="auth-avatar-icon">
            <div className="auth-avatar-ring" />
            <User size={30} />
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => switchTab('login')}
              type="button"
            >
              <LogIn size={15} /> Sign In
            </button>
            <button
              className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => switchTab('register')}
              type="button"
            >
              <UserPlus size={15} /> Create Account
            </button>
          </div>

          <div className="auth-header">
            <h3>{tab === 'login' ? 'Welcome back' : 'Create your account'}</h3>
            <p>{tab === 'login' ? 'Sign in to continue to LLM Client.' : 'Get started — it only takes a moment.'}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {tab === 'register' && (
              <div className="auth-field">
                <label>Full Name</label>
                <div className="auth-input-wrap">
                  <User size={14} className="auth-field-icon" />
                  <input
                    type="text"
                    className="input-base"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label>Email</label>
              <div className="auth-input-wrap">
                <Mail size={14} className="auth-field-icon" />
                <input
                  type="email"
                  className="input-base"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus={tab === 'login'}
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-input-wrap">
                <Lock size={14} className="auth-field-icon" />
                <input
                  type="password"
                  className="input-base"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {tab === 'register' && (
              <div className="auth-field">
                <label>Confirm Password</label>
                <div className="auth-input-wrap">
                  <Lock size={14} className="auth-field-icon" />
                  <input
                    type="password"
                    className="input-base"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="auth-error">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading}
            >
              {loading
                ? 'Please wait…'
                : tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}>
              {tab === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
