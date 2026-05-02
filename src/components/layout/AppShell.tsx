import * as React from 'react';
import { NavLink } from 'react-router-dom';

import { Icon, type IconName } from '@/components/shared/Icon';

interface NavItem {
  to: string;
  end?: boolean;
  icon: IconName;
  label: string;
}

const mainNav: NavItem[] = [
  { to: '/', end: true, icon: 'dashboard', label: 'Dashboard' },
  { to: '/projects', icon: 'projects', label: 'Projects' },
  { to: '/configurations', icon: 'config', label: 'Configurations' },
  { to: '/results', icon: 'results', label: 'Results' },
];

const supportNav: NavItem[] = [{ to: '/help', icon: 'help', label: 'Help' }];

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
  padding: '16px 12px 6px',
};

function navItemStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: active ? 600 : 500,
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    background: active ? 'var(--bg-hover)' : 'transparent',
    transition: 'all 0.15s',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'inherit',
    textDecoration: 'none',
  };
}

function NavItemLink({ item }: { item: NavItem }) {
  return (
    <NavLink to={item.to} end={item.end} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <div
          style={navItemStyle(isActive)}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
        >
          <Icon name={item.icon} size={18} /> {item.label}
        </div>
      )}
    </NavLink>
  );
}

function Sidebar() {
  return (
    <aside
      style={{
        width: 'var(--sidebar-w)',
        minWidth: 'var(--sidebar-w)',
        height: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        transition: 'width 0.2s',
      }}
    >
      <div
        className="drag-region"
        style={{
          padding: '44px 20px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #58a6ff 0%, #bc8cff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="terminal" size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em' }}>IAE</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
            Assignment Environment
          </div>
        </div>
      </div>

      <nav
        className="no-drag"
        style={{
          flex: 1,
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflowY: 'auto',
        }}
        aria-label="Main navigation"
      >
        <div style={sectionLabel}>Main</div>
        {mainNav.map((item) => (
          <NavItemLink key={item.to} item={item} />
        ))}
        <div style={sectionLabel}>Support</div>
        {supportNav.map((item) => (
          <NavItemLink key={item.to} item={item} />
        ))}
      </nav>

      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--bg-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--accent)',
          }}
        >
          L
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Lecturer</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CE 316</div>
        </div>
      </div>
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 32,
          background: 'var(--bg-primary)',
        }}
      >
        {children}
      </main>
    </div>
  );
}
