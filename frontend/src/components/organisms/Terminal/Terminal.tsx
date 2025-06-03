
import React, { memo, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { connectWebSocket, clearOutput, disconnectWebSocket } from '@/store/slices/terminalSlice';
import Button from '@/components/atoms/Button/Button';
import Card from '@/components/atoms/Card/Card';
import './Terminal.scss';

const Terminal: React.FC = memo(() => {
  const dispatch = useDispatch();
  const { output, isConnected, isExecuting } = useSelector((state: RootState) => state.terminal);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    dispatch(connectWebSocket());
    return () => {
      dispatch(disconnectWebSocket());
    };
  }, [dispatch]);

  const handleClear = () => {
    dispatch(clearOutput());
  };

  const handleReconnect = () => {
    dispatch(disconnectWebSocket());
    setTimeout(() => {
      dispatch(connectWebSocket());
    }, 1000);
  };

  return (
    <Card className="terminal" padding="none">
      <div className="terminal__header">
        <div className="terminal__status">
          <span className={`terminal__indicator ${isConnected ? 'terminal__indicator--connected' : 'terminal__indicator--disconnected'}`} />
          <span className="terminal__status-text">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {isExecuting && (
            <span className="terminal__executing">
              <span className="terminal__spinner" />
              Executing...
            </span>
          )}
        </div>
        <div className="terminal__controls">
          <Button
            size="small"
            variant="secondary"
            onClick={handleClear}
            disabled={isExecuting}
          >
            Clear Output
          </Button>
          <Button
            size="small"
            variant="secondary"
            onClick={handleReconnect}
            disabled={isExecuting}
          >
            Reset Connection
          </Button>
        </div>
      </div>
      <div className="terminal__content" ref={terminalRef}>
        {output.length === 0 ? (
          <div className="terminal__empty">
            Terminal ready. Waiting for test execution...
          </div>
        ) : (
          output.map((line, index) => (
            <div key={index} className="terminal__line">
              {line}
            </div>
          ))
        )}
      </div>
    </Card>
  );
});

Terminal.displayName = 'Terminal';

export default Terminal;
