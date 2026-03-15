import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import './UserProfile.css';

export default function UserProfile() {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="user-profile" ref={ref}>
      <button className="profile-trigger" onClick={() => setOpen(o => !o)}>
        <div className="profile-avatar">{initials}</div>
        <span className="profile-name">{user.name.split(' ')[0]}</span>
        <ChevronDown size={14} className={`profile-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="profile-dropdown glass-panel">
          <div className="profile-info">
            <div className="profile-avatar-lg">{initials}</div>
            <div>
              <div className="profile-full-name">{user.name}</div>
              <div className="profile-email">{user.email}</div>
            </div>
          </div>
          <div className="profile-divider" />
          <button className="profile-logout" onClick={() => { logout(); setOpen(false); }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
