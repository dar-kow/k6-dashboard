import React from 'react';

export type TypographyVariant =
    | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    | 'body1' | 'body2' | 'caption' | 'overline'
    | 'subtitle1' | 'subtitle2';

export type TypographyColor =
    | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
    | 'gray' | 'white' | 'inherit';

export interface TypographyProps {
    variant?: TypographyVariant;
    color?: TypographyColor;
    children: React.ReactNode;
    className?: string;
    component?: keyof JSX.IntrinsicElements;
    align?: 'left' | 'center' | 'right' | 'justify';
    weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

export const Typography: React.FC<TypographyProps> = ({
    variant = 'body1',
    color = 'inherit',
    children,
    className = '',
    component,
    align = 'left',
    weight,
    ...props
}) => {
    // Determine component based on variant
    const getComponent = (): keyof JSX.IntrinsicElements => {
        if (component) return component;

        switch (variant) {
            case 'h1': return 'h1';
            case 'h2': return 'h2';
            case 'h3': return 'h3';
            case 'h4': return 'h4';
            case 'h5': return 'h5';
            case 'h6': return 'h6';
            case 'caption':
            case 'overline':
                return 'span';
            default:
                return 'p';
        }
    };

    // Variant styles
    const variantClasses = {
        h1: 'text-4xl font-bold leading-tight',
        h2: 'text-3xl font-bold leading-tight',
        h3: 'text-2xl font-semibold leading-snug',
        h4: 'text-xl font-semibold leading-snug',
        h5: 'text-lg font-medium leading-normal',
        h6: 'text-base font-medium leading-normal',
        subtitle1: 'text-lg leading-relaxed',
        subtitle2: 'text-base leading-relaxed',
        body1: 'text-base leading-relaxed',
        body2: 'text-sm leading-relaxed',
        caption: 'text-xs leading-normal',
        overline: 'text-xs uppercase tracking-wider font-medium',
    };

    // Color styles
    const colorClasses = {
        primary: 'text-blue-600',
        secondary: 'text-gray-600',
        success: 'text-green-600',
        warning: 'text-yellow-600',
        error: 'text-red-600',
        gray: 'text-gray-500',
        white: 'text-white',
        inherit: '',
    };

    // Alignment styles
    const alignClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
        justify: 'text-justify',
    };

    // Weight styles (override variant defaults)
    const weightClasses = weight ? {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
    }[weight] : '';

    const finalClasses = [
        variantClasses[variant],
        colorClasses[color],
        alignClasses[align],
        weightClasses,
        className,
    ].filter(Boolean).join(' ');

    const Component = getComponent();

    return React.createElement(Component, {
        className: finalClasses,
        ...props
    }, children);
};

// ========================
// Icon Component
// ========================

export type IconName =
    | 'check' | 'warning' | 'error' | 'info'
    | 'arrow-right' | 'arrow-left' | 'arrow-up' | 'arrow-down'
    | 'chevron-right' | 'chevron-left' | 'chevron-up' | 'chevron-down'
    | 'close' | 'menu' | 'search' | 'filter'
    | 'download' | 'upload' | 'refresh' | 'settings'
    | 'play' | 'pause' | 'stop'
    | 'chart' | 'table' | 'list' | 'grid'
    | 'calendar' | 'clock' | 'user' | 'users'
    | 'folder' | 'file' | 'copy' | 'link'
    | 'heart' | 'star' | 'bookmark'
    | 'plus' | 'minus' | 'edit' | 'trash';

export interface IconProps {
    name: IconName;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    color?: string;
    className?: string;
}

export const Icon: React.FC<IconProps> = ({
    name,
    size = 'md',
    color = 'currentColor',
    className = '',
}) => {
    const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8',
    };

    const iconClasses = `${sizeClasses[size]} ${className}`;

    // Icon SVG paths - podstawowe ikony
    const iconPaths: Record<IconName, string> = {
        check: 'M5 13l4 4L19 7',
        warning: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
        info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        'arrow-right': 'M14 5l7 7m0 0l-7 7m7-7H3',
        'arrow-left': 'M10 19l-7-7m0 0l7-7m-7 7h18',
        'arrow-up': 'M5 10l7-7m0 0l7 7m-7-7v18',
        'arrow-down': 'M19 14l-7 7m0 0l-7-7m7 7V3',
        'chevron-right': 'M9 5l7 7-7 7',
        'chevron-left': 'M15 19l-7-7 7-7',
        'chevron-up': 'M5 15l7-7 7 7',
        'chevron-down': 'M19 9l-7 7-7-7',
        close: 'M6 18L18 6M6 6l12 12',
        menu: 'M4 6h16M4 12h16M4 18h16',
        search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
        filter: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
        download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
        upload: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
        refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
        settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
        play: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        pause: 'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z',
        stop: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
        chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        table: 'M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1V10z',
        list: 'M4 6h16M4 10h16M4 14h16M4 18h16',
        grid: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
        calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
        clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z',
        folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
        file: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        copy: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
        link: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
        heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
        star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
        bookmark: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
        plus: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
        minus: 'M20 12H4',
        edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
        trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    };

    const path = iconPaths[name];

    if (!path) {
        console.warn(`Icon "${name}" not found`);
        return null;
    }

    return (
        <svg
            className={iconClasses}
            fill="none"
            stroke={color}
            viewBox="0 0 24 24"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d={path} />
        </svg>
    );
};