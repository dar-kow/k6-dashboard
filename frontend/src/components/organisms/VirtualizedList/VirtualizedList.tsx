import React, { memo, useMemo, useCallback, useState } from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps<T> {
    items: T[];
    itemHeight: number;
    height: number;
    renderItem: (props: { index: number; item: T; style: React.CSSProperties }) => React.ReactNode;
    className?: string;
    onScroll?: (scrollTop: number) => void;
    overscan?: number;
}

function VirtualizedListComponent<T>({
    items,
    itemHeight,
    height,
    renderItem,
    className,
    onScroll,
    overscan = 5,
}: VirtualizedListProps<T>) {
    const [scrollTop, setScrollTop] = useState(0);

    const handleScroll = useCallback(({ scrollTop }: { scrollTop: number }) => {
        setScrollTop(scrollTop);
        onScroll?.(scrollTop);
    }, [onScroll]);

    const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
        const item = items[index];
        return renderItem({ index, item, style });
    }, [items, renderItem]);

    // Memoize the total height calculation
    const totalHeight = useMemo(() => items.length * itemHeight, [items.length, itemHeight]);

    return (
        <div className={className}>
            <List
                height={height}
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

VirtualizedList.displayName = 'VirtualizedList';