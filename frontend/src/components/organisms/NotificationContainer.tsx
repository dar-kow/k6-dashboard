import React, { memo, useCallback, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import {
    selectNotifications,
    removeNotification
} from '../../store/slices/uiSlice';

const NotificationContainer: React.FC = memo(() => {
    const notifications = useAppSelector(selectNotifications);
    const dispatch = useAppDispatch();

    const handleRemoveNotification = useCallback((id: string) => {
        dispatch(removeNotification(id));
    }, [dispatch]);

    // Auto-remove notifications after 5 seconds
    useEffect(() => {
        const timers = notifications.map(notification => {
            if (notification.type !== 'error') { // Errors stay until manually dismissed
                return setTimeout(() => {
                    handleRemoveNotification(notification.id);
                }, 5000);
            }
            return null;
        });

        return () => {
            timers.forEach(timer => timer && clearTimeout(timer));
        };
    }, [notifications, handleRemoveNotification]);

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            {notifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRemove={handleRemoveNotification}
                />
            ))}
        </div>
    );
});

// Individual notification item - memoized
const NotificationItem: React.FC<{
    notification: {
        id: string;
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message: string;
    };
    onRemove: (id: string) => void;
}> = memo(({ notification, onRemove }) => {
    const handleClose = useCallback(() => {
        onRemove(notification.id);
    }, [notification.id, onRemove]);

    return (
        <div className={`notification notification--${notification.type} animate-slide-in`}>
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <h4 className="font-medium">{notification.title}</h4>
                    <p className="text-sm mt-1">{notification.message}</p>
                </div>
                <button
                    onClick={handleClose}
                    className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
});

NotificationContainer.displayName = 'NotificationContainer';
NotificationItem.displayName = 'NotificationItem';

export default NotificationContainer;