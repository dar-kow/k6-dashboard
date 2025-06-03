
import React, { memo } from 'react';
import classNames from 'classnames';
import './Button.scss';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button: React.FC<ButtonProps> = memo(({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className,
  ...props
}) => {
  const buttonClass = classNames(
    'button',
    `button--${variant}`,
    `button--${size}`,
    {
      'button--loading': loading,
      'button--disabled': disabled || loading,
      'button--with-icon': icon,
    },
    className
  );

  return (
    <button
      className={buttonClass}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="button__spinner" />}
      {icon && iconPosition === 'left' && <span className="button__icon">{icon}</span>}
      {children && <span className="button__text">{children}</span>}
      {icon && iconPosition === 'right' && <span className="button__icon">{icon}</span>}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
