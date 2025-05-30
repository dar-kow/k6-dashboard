import React, { memo, useState, useCallback } from 'react';
import { Input, Button, Icon } from '../../atoms';
import { useDebounce } from '../../../hooks/useDebounce';
import './SearchBox.scss';

export interface SearchBoxProps {
    placeholder?: string;
    onSearch: (query: string) => void;
    onClear?: () => void;
    loading?: boolean;
    debounceMs?: number;
    className?: string;
}

export const SearchBox = memo<SearchBoxProps>(({
    placeholder = 'Search...',
    onSearch,
    onClear,
    loading = false,
    debounceMs = 300,
    className = '',
}) => {
    const [query, setQuery] = useState('');

    const debouncedQuery = useDebounce(query, debounceMs);

    React.useEffect(() => {
        onSearch(debouncedQuery);
    }, [debouncedQuery, onSearch]);

    const handleClear = useCallback(() => {
        setQuery('');
        onClear?.();
    }, [onClear]);

    const searchIcon = <Icon name="search" size="sm" />;
    const clearButton = query && (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="search-box__clear"
        >
            <Icon name="x" size="sm" />
        </Button>
    );

    return (
        <div className={`search-box ${className}`}>
            <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                leftIcon={searchIcon}
                rightIcon={clearButton}
                fullWidth
            />
            {loading && (
                <div className="search-box__loading">
                    <Icon name="spinner" size="sm" />
                </div>
            )}
        </div>
    );
});

SearchBox.displayName = 'SearchBox';