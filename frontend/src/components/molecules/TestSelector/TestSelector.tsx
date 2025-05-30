import React, { memo } from 'react';
import { Button, Badge, Icon } from '../../atoms';
import './TestSelector.scss';

export interface TestOption {
    id: string;
    name: string;
    description?: string;
    type?: 'individual' | 'sequential' | 'parallel';
    lastRun?: Date;
    status?: 'success' | 'warning' | 'error';
}

export interface TestSelectorProps {
    options: TestOption[];
    selectedId?: string;
    onSelect: (id: string) => void;
    loading?: boolean;
    emptyMessage?: string;
}

export const TestSelector = memo<TestSelectorProps>(({
    options,
    selectedId,
    onSelect,
    loading = false,
    emptyMessage = 'No tests available',
}) => {
    const getTypeIcon = (type?: string) => {
        switch (type) {
            case 'individual': return '🎯';
            case 'sequential': return '📋';
            case 'parallel': return '⚡';
            default: return '📊';
        }
    };

    const getTypeBadge = (type?: string) => {
        switch (type) {
            case 'individual': return { variant: 'info' as const, label: 'Individual' };
            case 'sequential': return { variant: 'primary' as const, label: 'Sequential' };
            case 'parallel': return { variant: 'success' as const, label: 'Parallel' };
            default: return { variant: 'secondary' as const, label: 'Test' };
        }
    };

    if (loading) {
        return (
            <div className="test-selector test-selector--loading">
                <div className="test-selector__skeleton" />
            </div>
        );
    }

    if (options.length === 0) {
        return (
            <div className="test-selector test-selector--empty">
                <Icon name="folder" size="lg" />
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="test-selector">
            <div className="test-selector__header">
                <h3 className="test-selector__title">
                    <Icon name="list" size="sm" />
                    Select Test Run
                </h3>
                <Badge variant="secondary" size="sm">
                    {options.length} available
                </Badge>
            </div>

            <div className="test-selector__list">
                {options.map((option) => {
                    const typeBadge = getTypeBadge(option.type);
                    const isSelected = selectedId === option.id;

                    return (
                        <button
                            key={option.id}
                            className={`test-selector__item ${isSelected ? 'test-selector__item--selected' : ''}`}
                            onClick={() => onSelect(option.id)}
                        >
                            <div className="test-selector__item-header">
                                <span className="test-selector__item-icon">
                                    {getTypeIcon(option.type)}
                                </span>
                                <span className="test-selector__item-name">{option.name}</span>
                                {isSelected && (
                                    <Badge variant="primary" size="sm">Latest</Badge>
                                )}
                            </div>

                            {option.description && (
                                <p className="test-selector__item-description">
                                    {option.description}
                                </p>
                            )}

                            <div className="test-selector__item-footer">
                                <Badge variant={typeBadge.variant} size="sm">
                                    {typeBadge.label}
                                </Badge>

                                {option.lastRun && (
                                    <span className="test-selector__item-date">
                                        {option.lastRun.toLocaleDateString()}
                                    </span>
                                )}

                                {option.status && (
                                    <Badge variant={option.status} size="sm">
                                        {option.status}
                                    </Badge>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
});

TestSelector.displayName = 'TestSelector';