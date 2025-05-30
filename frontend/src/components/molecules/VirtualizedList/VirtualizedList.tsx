import React, { memo, useMemo, useState, useCallback } from 'react';
import { useIntersectionObserver } from '@hooks/useIntersectionObserver';

interface VirtualizedListProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
    className?: string;
}

export const VirtualizedList = memo(<T extends any>({
    items,
    renderItem,
    itemHeight,
    containerHeight,
    overscan = 5,
    className = '',
}: VirtualizedListProps<T>) => {
    const [scrollTop, setScrollTop] = useState(0);

    const visibleRange = useMemo(() => {
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        const endIndex = Math.min(
            items.length - 1,
            Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
        );

        return { startIndex, endIndex };
    }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

    const visibleItems = useMemo(() => {
        const result = [];
        for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
            result.push({
                index: i,
                item: items[i],
                offsetY: i * itemHeight,
            });
        }
        return result;
    }, [items, visibleRange, itemHeight]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    const totalHeight = items.length * itemHeight;

    return (
        <div
            className={`virtualized-list ${className}`}
            style={{ height: containerHeight, overflow: 'auto' }}
            onScroll={handleScroll}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                {visibleItems.map(({ index, item, offsetY }) => (
                    <div
                        key={index}
                        style={{
                            position: 'absolute',
                            top: offsetY,
                            left: 0,
                            right: 0,
                            height: itemHeight,
                        }}
                    >
                        {renderItem(item, index)}
                    </div>
                ))}
            </div>
        </div>
    );
}) as <T>(props: VirtualizedListProps<T>) => JSX.Element;

(VirtualizedList as any).displayName = 'VirtualizedList';