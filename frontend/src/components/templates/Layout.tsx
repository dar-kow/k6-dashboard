import React, { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store';
import { selectSidebarCollapsed } from '../../store/slices/uiSlice';
import NotificationContainer from '../organisms/NotificationContainer';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = memo(({ children }) => {
    const location = useLocation();
    const sidebarCollapsed = useAppSelector(selectSidebarCollapsed);

    const navigationItems = [
        {
            path: '/',
            name: 'Dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            path: '/results',
            name: 'Test Results',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        {
            path: '/test-runner',
            name: 'Test Runner',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className={`bg-gray-800 text-white transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'
                }`}>
                <div className="p-4">
                    <h1 className={`text-2xl font-bold transition-all duration-300 ${sidebarCollapsed ? 'text-sm' : 'text-2xl'
                        }`}>
                        {sidebarCollapsed ? 'K6' : 'K6 Dashboard'}
                    </h1>
                </div>

                <nav className="mt-6">
                    <ul>
                        {navigationItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`flex items-center px-4 py-3 transition-colors duration-200 ${location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                                        ? 'bg-gray-700'
                                        : 'hover:bg-gray-700'
                                        }`}
                                    title={sidebarCollapsed ? item.name : undefined}
                                >
                                    <span className="mr-3">{item.icon}</span>
                                    {!sidebarCollapsed && <span>{item.name}</span>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-auto">
                <div className="p-6">{children}</div>
            </div>

            {/* Notifications */}
            <NotificationContainer />
        </div>
    );
});

Layout.displayName = 'Layout';

export default Layout;