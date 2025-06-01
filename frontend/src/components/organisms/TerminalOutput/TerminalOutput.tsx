import React, { useRef, useEffect, useState, memo, useCallback } from 'react';

interface TerminalOutputProps {
    output: string[];
    autoScroll?: boolean;
    onAutoScrollToggle?: () => void;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = memo(({
    output,
    autoScroll = true,
    onAutoScrollToggle
}) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const [processedOutput, setProcessedOutput] = useState<string[]>([]);

    // Process output to handle k6 progress bars
    useEffect(() => {
        const processOutput = (rawOutput: string[]) => {
            const processed: string[] = [];

            for (let i = 0; i < rawOutput.length; i++) {
                const line = rawOutput[i];

                // Check if this is a k6 progress line
                if (isK6ProgressLine(line)) {
                    // Replace any existing progress line instead of adding new one
                    const lastIndex = processed.length - 1;
                    if (lastIndex >= 0 && isK6ProgressLine(processed[lastIndex])) {
                        processed[lastIndex] = formatK6ProgressLine(line);
                    } else {
                        processed.push(formatK6ProgressLine(line));
                    }
                } else {
                    processed.push(line);
                }
            }

            return processed;
        };

        setProcessedOutput(processOutput(output));
    }, [output]);

    // Auto-scroll to the bottom when output updates (only if autoScroll is enabled)
    useEffect(() => {
        if (autoScroll && terminalRef.current) {
            // Force scroll to bottom with smooth behavior
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [processedOutput, autoScroll]);

    // Also scroll when the component mounts or updates (only if autoScroll is enabled)
    useEffect(() => {
        const scrollToBottom = () => {
            if (autoScroll && terminalRef.current) {
                terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
            }
        };

        if (autoScroll) {
            // Scroll immediately
            scrollToBottom();

            // Also scroll after a small delay to ensure content is rendered
            const timeoutId = setTimeout(scrollToBottom, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [autoScroll]);

    // Helper function to detect k6 progress lines
    const isK6ProgressLine = useCallback((line: string): boolean => {
        return line.includes('default [') &&
            line.includes('%') &&
            line.includes('VUs') &&
            (line.includes('running') || line.includes('complete'));
    }, []);

    // Helper function to format k6 progress lines as visual progress bars
    const formatK6ProgressLine = useCallback((line: string): string => {
        // Extract percentage from line like "default [ 42% ] 10 VUs 0m25.0s/1m0s"
        const percentMatch = line.match(/\[\s*(\d+)%\s*\]/);
        const vusMatch = line.match(/(\d+)\s+VUs/);
        const timeMatch = line.match(/(\d+m\d+\.\d+s\/\d+m\d+s)/);

        if (percentMatch && vusMatch && timeMatch) {
            const percent = parseInt(percentMatch[1]);
            const vus = vusMatch[1];
            const time = timeMatch[1];

            // Create visual progress bar
            const totalWidth = 40;
            const filledWidth = Math.floor((percent / 100) * totalWidth);
            const emptyWidth = totalWidth - filledWidth;

            const progressBar = '='.repeat(filledWidth) + '>' + '-'.repeat(Math.max(0, emptyWidth - 1));

            return `default   [${progressBar}] ${vus} VUs  ${time}`;
        }

        return line;
    }, []);

    const scrollToBottom = useCallback(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTo({
                top: terminalRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, []);

    const scrollToTop = useCallback(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }, []);

    return (
        <div className="relative">
            <div
                ref={terminalRef}
                className="bg-gray-900 text-gray-100 font-mono p-4 rounded-md h-80 overflow-y-auto"
                style={{
                    fontSize: '13px',
                    lineHeight: '1.2',
                    fontFamily: 'Consolas, "Courier New", monospace',
                    scrollBehavior: 'smooth'
                }}
            >
                {processedOutput.length === 0 ? (
                    <div className="text-gray-400 italic">
                        No output yet. Run a test to see the k6 progress here.
                        <br />
                        <span className="text-xs">
                            {autoScroll ? 'Auto-scroll is ON - terminal will show latest progress.' : 'Auto-scroll is OFF - scroll manually to see latest progress.'}
                        </span>
                    </div>
                ) : (
                    processedOutput.map((line, index) => {
                        // Handle different types of output with appropriate styling
                        let className = 'whitespace-pre font-mono';

                        if (line.startsWith('ERROR') || line.includes('✗') || line.includes('failed')) {
                            className += ' text-red-400';
                        } else if (line.includes('successful') || line.includes('completed') || line.includes('✓')) {
                            className += ' text-green-400';
                        } else if (line.includes('Starting') || line.includes('Running') || line.includes('🚀')) {
                            className += ' text-blue-400';
                        } else if (line.includes('default   [') && line.includes('VUs')) {
                            // K6 progress bar lines - special styling
                            className += ' text-cyan-300 font-bold';
                        } else if (line.includes('WARNING') || line.includes('⚠')) {
                            className += ' text-yellow-400';
                        } else if (line.includes('🔄')) {
                            className += ' text-purple-400';
                        }

                        return (
                            <div key={index} className={className}>
                                {line || '\u00A0'} {/* Use non-breaking space for empty lines */}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Terminal control bar */}
            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                    <span>{processedOutput.length} lines</span>

                    {/* Auto-scroll toggle */}
                    {onAutoScrollToggle && (
                        <button
                            onClick={onAutoScrollToggle}
                            className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${autoScroll
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
                        >
                            <div className={`w-2 h-2 rounded-full ${autoScroll ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span>Auto-scroll: {autoScroll ? 'ON' : 'OFF'}</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    {/* Manual scroll controls */}
                    <button
                        onClick={scrollToTop}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                        title="Scroll to top"
                    >
                        ↑ Top
                    </button>

                    <button
                        onClick={scrollToBottom}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                        title="Scroll to bottom"
                    >
                        ↓ Bottom
                    </button>

                    <div className="flex items-center space-x-1">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            📺 Live Terminal
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});

TerminalOutput.displayName = 'TerminalOutput';

export default TerminalOutput;