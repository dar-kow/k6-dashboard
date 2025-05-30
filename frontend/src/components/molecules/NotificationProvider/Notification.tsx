import React, { memo, useEffect, useState } from 'react';
import { Button, Icon } from '@components/atoms';
import { useNotifications } from '@hooks/useNotifications';

interface NotificationState {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
    persistent?: boolean;
}

interface NotificationProps {
    notification: NotificationState;
}

export const Notification = memo<NotificationProps>(({ notification }) => {
    const { remove } = useNotifications();
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsLeaving(true);
        setTimeout(() => remove(notification.id), 300);
    };

    const getIcon = () => {
        switch (notification.type) {
            case 'success':
                return <Icon name="check-circle" size="md" />;
            case 'error':
                return <Icon name="x-circle" size="md" />;
            case 'warning':
                return <Icon name="alert-triangle" size="md" />;
            case 'info':
                return <Icon name="info" size="md" />;
            default:
                return <Icon name="bell" size="md" />;
        }
    };

    const notificationClasses = [
        'notification',
        `notification--${notification.type}`,
        isVisible && 'notification--visible',
        isLeaving && 'notification--leaving',
    ].filter(Boolean).join(' ');

    return (
        <div className={notificationClasses}>
            <div className="notification__icon">
                {getIcon()}
            </div>

            <div className="notification__content">
                <h4 className="notification__title">{notification.title}</h4>
                {notification.message && (
                    <p className="notification__message">{notification.message}</p>
                )}
            </div>

            <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="notification__close"
                aria-label="Close notification"
            >
                <Icon name="x" size="sm" />
            </Button>
        </div>
    );
});

Notification.displayName = 'Notification';