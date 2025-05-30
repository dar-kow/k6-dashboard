import React, { memo } from 'react';
import { Sidebar } from '../../organisms/Sidebar/Sidebar';
import { Header } from '../../organisms/Header/Header';
import './MainLayout.scss';

export interface MainLayoutProps {
    children: React.ReactNode;
    title?: string;
    actions?: React.ReactNode;
}

export const MainLayout = memo<MainLayoutProps>(({
    children,
    title,
    actions,
}) => {
    return (
        <div className="main-layout">
            <Sidebar className="main-layout__sidebar" />

            <div className="main-layout__content">
                <Header
                    title={title}
                    actions={actions}
                    className="main-layout__header"
                />

                <main className="main-layout__main">
                    {children}
                </main>
            </div>
        </div>
    );
});

MainLayout.displayName = 'MainLayout';