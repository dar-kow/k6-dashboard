import React from 'react';

interface MetricCardProps {
    title: string;
    value: string;
    type: 'number' | 'rate' | 'time' | 'size' | 'success' | 'error';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, type }) => {
    const getIconAndColor = () => {
        switch (type) {
            case 'number':
                return {
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                        </svg>
                    ),
                    color: 'bg-blue-100 text-blue-600',
                };
            case 'rate':
                return {
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                    ),
                    color: 'bg-purple-100 text-purple-600',
                };
            case 'time':
                return {
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    ),
                    color: 'bg-orange-100 text-orange-600',
                };
            case 'size':
                return {
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                        </svg>
                    ),
                    color: 'bg-indigo-100 text-indigo-600',
                };
            case 'success':
                return {
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    ),
                    color: 'bg-green-100 text-green-600',
                };
            case 'error':
                return {
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    ),
                    color: 'bg-red-100 text-red-600',
                };
            default:
                return {
                    icon: null,
                    color: 'bg-gray-100 text-gray-600',
                };
        }
    };

    const { icon, color } = getIconAndColor();

    return (
        <div className="bg-white border rounded-lg shadow-sm p-4">
            <div className="flex items-center">
                <div className={`p-2 rounded-md ${color} mr-3`}>{icon}</div>
                <div>
                    <p className="text-xs font-medium text-gray-500">{title}</p>
                    <p className="text-lg font-semibold">{value}</p>
                </div>
            </div>
        </div>
    );
};

export default MetricCard;