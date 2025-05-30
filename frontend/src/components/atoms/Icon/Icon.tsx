import React, { memo } from 'react';

export interface IconProps {
    name: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: string;
    className?: string;
}

const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
};

export const Icon = memo<IconProps>(({
    name,
    size = 'md',
    color = 'currentColor',
    className = ''
}) => {
    const iconSize = iconSizes[size];

    // Icon components mapping
    const iconComponents: Record<string, React.ReactNode> = {
        dashboard: (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
        chart: (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        play: (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        zap: (
            <svg width={iconSize} height={iconSize} fill={color} viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        wifi: (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
        ),
        activity: (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v16h16" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12l4-4 4 4 6-6" />
            </svg>
        ),
        clock: (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        'alert-circle': (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        'trending-up': (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
        ),
        download: (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
        ),
        search: (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        ),
        x: (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
        list: (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        ),
        'file-text': (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2v6h6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 13H8" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 17H8" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9H8" />
            </svg>
        ),
        'arrow-left': (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m7-7l-7 7 7 7" />
            </svg>
        ),
        'chevron-left': (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
        ),
        'chevron-right': (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
        ),
        refresh: (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
        folder: (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
        ),
        bell: (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
        'check-circle': (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        'x-circle': (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        'alert-triangle': (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        info: (
            <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        spinner: (
            <svg width={iconSize} height={iconSize} fill="none" viewBox="0 0 24 24" className="animate-spin">
                <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="4" strokeDasharray="32" strokeDashoffset="32">
                    <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite" />
                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite" />
                </circle>
            </svg>
        )
    };

    return (
        <span className={`icon ${className}`}>
            {iconComponents[name] || (
                <svg width={iconSize} height={iconSize} fill="none" stroke={color} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )}
        </span>
    );
});

Icon.displayName = 'Icon';