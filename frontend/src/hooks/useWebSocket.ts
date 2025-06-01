import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppDispatch } from '../store';
import { addNotification } from '../store/slices/uiSlice';

interface UseWebSocketOptions {
  url: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (data: any) => void;
  enabled?: boolean;
}

export const useWebSocket = (options: UseWebSocketOptions) => {
  const {
    url,
    reconnectAttempts = 5,
    reconnectInterval = 1000,
    onOpen,
    onClose,
    onError,
    onMessage,
    enabled = true,
  } = options;

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<
    'connecting' | 'open' | 'closed' | 'error'
  >('closed');
  const ws = useRef<WebSocket | null>(null);
  const reconnectCount = useRef<number>(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const dispatch = useAppDispatch();

  const connect = useCallback(() => {
    if (!enabled || ws.current?.readyState === WebSocket.OPEN) return;

    try {
      setConnectionState('connecting');
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setIsConnected(true);
        setConnectionState('open');
        reconnectCount.current = 0;
        onOpen?.();

        dispatch(
          addNotification({
            type: 'success',
            title: 'Connected',
            message: 'WebSocket connection established',
          })
        );
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        setConnectionState('closed');
        onClose?.();

        // Attempt reconnection
        if (enabled && reconnectCount.current < reconnectAttempts) {
          const delay = reconnectInterval * Math.pow(2, reconnectCount.current);
          reconnectTimeout.current = setTimeout(() => {
            reconnectCount.current++;
            connect();
          }, delay);
        } else if (reconnectCount.current >= reconnectAttempts) {
          dispatch(
            addNotification({
              type: 'error',
              title: 'Connection Lost',
              message: 'Failed to reconnect to WebSocket after multiple attempts',
            })
          );
        }
      };

      ws.current.onerror = error => {
        setConnectionState('error');
        onError?.(error);

        console.error('WebSocket error:', error);
      };

      ws.current.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', event.data);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionState('error');
    }
  }, [
    url,
    enabled,
    reconnectAttempts,
    reconnectInterval,
    onOpen,
    onClose,
    onError,
    onMessage,
    dispatch,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    setIsConnected(false);
    setConnectionState('closed');
  }, []);

  const sendMessage = useCallback((data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    connectionState,
    sendMessage,
    connect,
    disconnect,
  };
};
