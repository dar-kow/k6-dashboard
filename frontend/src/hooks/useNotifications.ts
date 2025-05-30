import { useCallback, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "./useAppSelector";
import {
  addNotification,
  removeNotification,
  clearNotifications,
} from "@store/slices/uiSlice";

export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.ui.notifications);

  const notify = useCallback(
    (notification: {
      type: "success" | "error" | "warning" | "info";
      title: string;
      message?: string;
      duration?: number;
      persistent?: boolean;
    }) => {
      dispatch(addNotification(notification));
    },
    [dispatch]
  );

  const success = useCallback(
    (title: string, message?: string) => {
      notify({ type: "success", title, message });
    },
    [notify]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      notify({ type: "error", title, message, persistent: true });
    },
    [notify]
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      notify({ type: "warning", title, message });
    },
    [notify]
  );

  const info = useCallback(
    (title: string, message?: string) => {
      notify({ type: "info", title, message });
    },
    [notify]
  );

  const remove = useCallback(
    (id: string) => {
      dispatch(removeNotification(id));
    },
    [dispatch]
  );

  const clear = useCallback(() => {
    dispatch(clearNotifications());
  }, [dispatch]);

  // Auto-remove notifications
  useEffect(() => {
    const timers: Record<string, NodeJS.Timeout> = {};

    notifications.forEach((notification) => {
      if (
        !notification.persistent &&
        notification.duration &&
        !timers[notification.id]
      ) {
        timers[notification.id] = setTimeout(() => {
          remove(notification.id);
          delete timers[notification.id];
        }, notification.duration);
      }
    });

    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, [notifications, remove]);

  return {
    notifications,
    notify,
    success,
    error,
    warning,
    info,
    remove,
    clear,
  };
};
