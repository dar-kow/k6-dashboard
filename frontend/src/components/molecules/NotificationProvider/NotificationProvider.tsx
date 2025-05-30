import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import { useNotifications } from '@hooks/useNotifications';
import { Notification } from './Notification';
import './NotificationProvider.scss';

export const NotificationProvider = memo(() => {
    const { notifications } = useNotifications();

    if (notifications.length === 0) {
        return null;
    }

    return createPortal(
        <div className="notification-container">
            {notifications.map((notification) => (
                <Notification
                    key={notification.id}
                    notification={notification}
                />
            ))}
        </div>,
        document.body
    );
});

NotificationProvider.displayName = 'NotificationProvider';