
import React, { memo } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.scss';

interface SidebarItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const sidebarItems: SidebarItem[] = [
  {
    path: '/',
    label: 'Dashboard',
    icon: '🏠',
  },
  {
    path: '/test-results',
    label: 'Test Results',
    icon: '📊',
  },
  {
    path: '/test-runner',
    label: 'Test Runner',
    icon: '▶️',
  },
];

const Sidebar: React.FC = memo(() => {
  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <h1 className="sidebar__title">K6 Dashboard</h1>
      </div>
      <nav className="sidebar__nav">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            <span className="sidebar__icon">{item.icon}</span>
            <span className="sidebar__label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
