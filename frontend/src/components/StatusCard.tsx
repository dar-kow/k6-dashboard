import React from 'react';

interface StatusCardProps {
    title: string;
    value: string;
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
}

const StatusCard: React.FC<StatusCardProps> = ({ title, value, status }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'healthy':
                return 'bg-green-100 text-green-600';
            case 'warning':
                return 'bg-yellow-100 text-yellow-600';
            case 'critical':
                return 'bg-red-100 text-red-600';
            case 'unknown':
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'healthy':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                );
            case 'critical':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                );
            case 'unknown':
            default:
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                );
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
                <div className={`p-3 rounded-full ${getStatusColor()} mr-4`}>
                    {getStatusIcon()}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-semibold">{value}</p>
                </div>
            </div>
        </div>
    );
};

export default StatusCard;