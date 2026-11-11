"use client";

import {
  useEffect,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

const CONTROL =
  "min-h-11 w-full rounded-[10px] border bg-white px-3.5 text-sm text-ink placeholder:text-ink-soft/70 focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:bg-surface disabled:text-ink-soft";

const borderFor = (error?: string) =>
  error ? "border-2 border-danger" : "border-line-strong focus:border-brand";

interface WrapperProps {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: (ids: { id: string; describedBy?: string }) => ReactNode;
}

/** Etiqueta, control y mensaje de error enlazados para lectores de pantalla */
function FieldWrapper({
  label,
  error,
  hint,
  className = "",
  children,
}: WrapperProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[13px] font-semibold text-gray-700">
        {label}
      </label>
      {children({ id, describedBy: message ? messageId : undefined })}
      {message && (
        <span
          id={messageId}
          className={`text-[13px] ${error ? "font-medium text-danger" : "text-ink-soft"}`}
        >
          {message}
        </span>
      )}
    </div>
  );
}

type Common = {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
};

export function TextField({
  label,
  error,
  hint,
  className,
  ...props
}: Common & InputHTMLAttributes<HTMLInputElement>) {
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
  className,
  options,
  placeholder,
  ...props
}: Common &
  SelectHTMLAttributes<HTMLSelectElement> & {
    options: { value: string; label: string }[];
    placeholder?: string;
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
          {placeholder !== undefined && <option value="">{placeholder}</option>}
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

export function TextAreaField({
  label,
  error,
  hint,
  className,
  ...props
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
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

/**
 * Selector de imagen con vista previa. `currentUrl` es la imagen guardada;
 * al elegir un archivo se muestra el nuevo hasta guardar.
 */
export function ImageField({
  label,
  name,
  currentUrl,
  className,
}: {
  label: string;
  name: string;
  currentUrl?: string | null;
  className?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const shown = preview ?? currentUrl ?? null;

  return (
    <FieldWrapper
      label={label}
      hint="JPG, PNG o WEBP, hasta 10 MB"
      className={className}
    >
      {({ id, describedBy }) => (
        <div className="flex items-center gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface">
            {shown ? (
              // Vista previa local (blob) o URL ya guardada; no pasa por next/image
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shown} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-xs text-ink-soft">Sin imagen</span>
            )}
          </div>
          <input
            id={id}
            name={name}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            aria-describedby={describedBy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
            className="min-h-11 w-full cursor-pointer rounded-[10px] border border-dashed border-[#9aa9c2] bg-white px-3 py-2 text-sm text-brand file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:font-semibold file:text-brand"
          />
        </div>
      )}
    </FieldWrapper>
  );
}
