import React, { memo } from 'react';
import { Button, Icon } from '@components/atoms';
import './Header.scss';

export interface HeaderProps {
    title?: string;
    actions?: React.ReactNode;
    className?: string;
}

export const Header = memo<HeaderProps>(({
    title,
    actions,
    className = '',
}) => {
    return (
        <header className={`header ${className}`}>
            <div className="header__content">
                <div className="header__title-section">
                    {title && (
                        <h1 className="header__title">{title}</h1>
                    )}
                </div>

                {actions && (
                    <div className="header__actions">
                        {actions}
                    </div>
                )}
            </div>
        </header>
    );
});

Header.displayName = 'Header';