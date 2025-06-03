
import React, { memo } from 'react';
import classNames from 'classnames';
import './Card.scss';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: 'none' | 'small' | 'medium' | 'large';
  hover?: boolean;
}

const Card: React.FC<CardProps> = memo(({
  children,
  className,
  padding = 'medium',
  shadow = 'small',
  hover = false,
}) => {
  const cardClass = classNames(
    'card',
    `card--padding-${padding}`,
    `card--shadow-${shadow}`,
    {
      'card--hover': hover,
    },
    className
  );

  return (
    <div className={cardClass}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
