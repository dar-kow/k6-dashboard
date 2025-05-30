import React, { memo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Icon, Badge } from '@components/atoms';
import './Sidebar.scss';

export interface SidebarProps {
    className?: string;
}

const navigationItems = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'dashboard',
        path: '/',
    },
    {
        id: 'results',
        label: 'Test Results',
        icon: 'chart',
        path: '/results',
    },
    {
        id: 'runner',
        label: 'Test Runner',
        icon: 'play',
        path: '/test-runner',
    },
];

export const Sidebar = memo<SidebarProps>(({
    className = '',
}) => {
    const location = useLocation();

    const isActiveRoute = (path: string) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <aside className={`sidebar ${className}`}>
            <div className="sidebar__header">
                <div className="sidebar__logo">
                    <Icon name="zap" size="lg" color="white" />
                    <h2 className="sidebar__brand">K6 Dashboard</h2>
                </div>
            </div>

            <nav className="sidebar__nav">
                <ul className="sidebar__nav-list">
                    {navigationItems.map((item) => {
                        const isActive = isActiveRoute(item.path);

                        return (
                            <li key={item.id} className="sidebar__nav-item">
                                <Link
                                    to={item.path}
                                    className={`sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`}
                                >
                                    <Icon
                                        name={item.icon}
                                        size="md"
                                        className="sidebar__nav-icon"
                                    />
                                    <span className="sidebar__nav-label">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="sidebar__footer">
                <div className="sidebar__status">
                    <Badge variant="success" size="sm">
                        <Icon name="wifi" size="sm" />
                        Connected
                    </Badge>
                </div>
            </div>
        </aside>
    );
});

Sidebar.displayName = 'Sidebar';