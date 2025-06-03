
import React, { memo } from 'react';
import Card from '@/components/atoms/Card/Card';
import './MetricCard.scss';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = memo(({
  title,
  value,
  change,
  icon,
  color = 'primary',
  loading = false,
}) => {
  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'success';
    if (change < 0) return 'danger';
    return 'neutral';
  };

  if (loading) {
    return (
      <Card className="metric-card metric-card--loading">
        <div className="metric-card__skeleton">
          <div className="metric-card__skeleton-icon"></div>
          <div className="metric-card__skeleton-content">
            <div className="metric-card__skeleton-title"></div>
            <div className="metric-card__skeleton-value"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`metric-card metric-card--${color}`}>
      <div className="metric-card__content">
        {icon && (
          <div className="metric-card__icon">
            {icon}
          </div>
        )}
        <div className="metric-card__data">
          <h3 className="metric-card__title">{title}</h3>
          <div className="metric-card__value">{value}</div>
          {change !== undefined && (
            <div className={`metric-card__change metric-card__change--${getChangeColor(change)}`}>
              {formatChange(change)}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';

export default MetricCard;
