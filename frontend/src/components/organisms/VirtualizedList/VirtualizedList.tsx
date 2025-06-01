import React, { memo, useCallback } from 'react';
import { FixedSizeList as List, ListOnScrollProps } from 'react-window';

interface VirtualizedListProps<T> {
    items: T[];
    itemHeight: number;
    height: number;
    width: number | string;
    renderItem: (props: { index: number; item: T; style: React.CSSProperties }) => React.ReactNode;
    className?: string;
    onScroll?: (scrollTop: number) => void;
    overscan?: number;
}

function VirtualizedListComponent<T>({
    items,
    itemHeight,
    height,
    width,
    renderItem,
    className,
    onScroll,
    overscan = 5,
}: VirtualizedListProps<T>) {
    // Handle scroll events
    const handleScroll = useCallback((props: ListOnScrollProps) => {
        onScroll?.(props.scrollOffset);
    }, [onScroll]);

    // Render individual row
    const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
        const item = items[index];
        return renderItem({ index, item, style });
    }, [items, renderItem]);

    return (
        <div className={className}>
            <List
                height={height}
                width={width}
                itemCount={items.length}
                itemSize={itemHeight}
                overscanCount={overscan}
                onScroll={handleScroll}
            >
                {Row}
            </List>
        </div>
    );
}

// Export with proper generic typing
export const VirtualizedList = memo(VirtualizedListComponent) as <T>(
    props: VirtualizedListProps<T>
) => React.ReactElement;