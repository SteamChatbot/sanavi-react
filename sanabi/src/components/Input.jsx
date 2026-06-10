import React from 'react';
import './Input.css';

/**
 * Input / Textarea
 * @param {'default'|'error'|'success'} state
 */
export default function Input({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  state = 'default',
  errorMsg,
  successMsg,
  disabled = false,
  multiline = false,
  rows = 3,
  className = '',
  ...rest
}) {
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      {label && <label className="field__label" htmlFor={id}>{label}</label>}
      <Tag
        id={id}
        type={multiline ? undefined : type}
        className={['field__input', `field__input--${state}`, multiline ? 'field__input--textarea' : ''].filter(Boolean).join(' ')}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={multiline ? rows : undefined}
        {...rest}
      />
      {state === 'error'   && errorMsg   && <p className="field__msg field__msg--error">{errorMsg}</p>}
      {state === 'success' && successMsg && <p className="field__msg field__msg--success">{successMsg}</p>}
    </div>
  );
}
