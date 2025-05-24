import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-gray-800 text-white">
                <div className="p-4">
                    <h1 className="text-2xl font-bold">K6 Dashboard</h1>
                </div>
                <nav className="mt-6">
                    <ul>
                        <li>
                            <Link
                                to="/"
                                className={`flex items-center px-4 py-3 ${location.pathname === '/' ? 'bg-gray-700' : 'hover:bg-gray-700'
                                    }`}
                            >
                                <span className="mr-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                    </svg>
                                </span>
                                Dashboard
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/results"
                                className={`flex items-center px-4 py-3 ${location.pathname.startsWith('/results') ? 'bg-gray-700' : 'hover:bg-gray-700'
                                    }`}
                            >
                                <span className="mr-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                    </svg>
                                </span>
                                Test Results
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/test-runner"
                                className={`flex items-center px-4 py-3 ${location.pathname.startsWith('/test-runner') ? 'bg-gray-700' : 'hover:bg-gray-700'
                                    }`}
                            >
                                <span className="mr-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </span>
                                Test Runner
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-auto">
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

export default Layout;