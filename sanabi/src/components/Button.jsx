import React from 'react';
import './Button.css';

/**
 * Button
 * @param {'primary'|'outline'|'ghost'|'danger'|'danger-solid'|'success'} variant
 * @param {'lg'|'md'|'sm'|'xs'} size
 * @param {boolean} disabled
 * @param {boolean} loading
 * @param {boolean} fullWidth
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      className={[
        'btn',
        `btn--${variant}`,
        `btn--${size}`,
        fullWidth ? 'btn--full' : '',
        loading  ? 'btn--loading' : '',
        className,
      ].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
