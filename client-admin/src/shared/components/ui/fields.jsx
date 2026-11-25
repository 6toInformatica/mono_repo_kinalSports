import { useId } from 'react';
import { CONTROL, borderFor } from './uiConstants.js';

/** Etiqueta, control y mensaje de error enlazados para lectores de pantalla */
export function FieldWrapper({ label, error, hint, className = '', children }) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className='text-[13px] font-semibold text-gray-700'>
        {label}
      </label>
      {children({ id, describedBy: message ? messageId : undefined })}
      {message && (
        <span
          id={messageId}
          className={`text-[13px] ${error ? 'font-medium text-danger' : 'text-ink-soft'}`}
        >
          {message}
        </span>
      )}
    </div>
  );
}

export function TextField({ label, error, hint, className = '', ...props }) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} className={className}>
      {({ id, describedBy }) => (
        <input
          id={id}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={`${CONTROL} ${borderFor(error)}`}
          {...props}
        />
      )}
    </FieldWrapper>
  );
}

export function SelectField({
  label,
  error,
  hint,
  className = '',
  options = [],
  placeholder,
  ...props
}) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} className={className}>
      {({ id, describedBy }) => (
        <select
          id={id}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={`${CONTROL} ${borderFor(error)}`}
          {...props}
        >
          {placeholder !== undefined && <option value=''>{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldWrapper>
  );
}

export function TextAreaField({ label, error, hint, className = '', ...props }) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} className={className}>
      {({ id, describedBy }) => (
        <textarea
          id={id}
          rows={3}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={`${CONTROL} py-2.5 ${borderFor(error)}`}
          {...props}
        />
      )}
    </FieldWrapper>
  );
}
