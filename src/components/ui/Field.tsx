'use client';

import React, { useId } from 'react';

export const CONTROL_CLASSES =
  'w-full rounded-lg border border-line bg-surface px-3 text-body text-ink transition-colors duration-150 hover:border-line-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-2 aria-[invalid=true]:border-error aria-[invalid=true]:focus:ring-error/20';

interface ControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

interface FieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  optional?: boolean;
  className?: string;
  // Extra controls shown on the right of the label (e.g. an AI button).
  actions?: React.ReactNode;
  children: (control: ControlProps) => React.ReactNode;
}

// Label + control + hint/error, wired together for screen readers.
export function Field({ label, hint, error, optional, className = '', actions, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <div className="mb-1.5 flex min-h-5 items-end justify-between gap-2">
        <label htmlFor={id} className="text-label font-medium text-ink">
          {label}
          {optional && <span className="ml-1 font-normal text-ink-2">(optional)</span>}
        </label>
        {actions}
      </div>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-label text-ink-2">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-label font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> };

export function Input({ className = '', ref, ...props }: InputProps) {
  return <input ref={ref} className={`${CONTROL_CLASSES} h-10 ${className}`} {...props} />;
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: React.Ref<HTMLTextAreaElement> };

export function Textarea({ className = '', rows = 4, ref, ...props }: TextareaProps) {
  return <textarea ref={ref} rows={rows} className={`${CONTROL_CLASSES} resize-y py-2 leading-6 ${className}`} {...props} />;
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select className={`${CONTROL_CLASSES} h-10 cursor-pointer pr-8 ${className}`} {...props}>
      {children}
    </select>
  );
}

// Convenience wrappers for the common case.
export function TextField({
  label,
  hint,
  error,
  optional,
  className,
  actions,
  ...inputProps
}: Omit<FieldProps, 'children'> & InputProps) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className} actions={actions}>
      {(control) => <Input {...control} {...inputProps} />}
    </Field>
  );
}

export function TextareaField({
  label,
  hint,
  error,
  optional,
  className,
  actions,
  ...textareaProps
}: Omit<FieldProps, 'children'> & TextareaProps) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className} actions={actions}>
      {(control) => <Textarea {...control} {...textareaProps} />}
    </Field>
  );
}

export function SelectField({
  label,
  hint,
  error,
  optional,
  className,
  actions,
  children,
  ...selectProps
}: Omit<FieldProps, 'children'> & SelectProps) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className} actions={actions}>
      {(control) => (
        <Select {...control} {...selectProps}>
          {children}
        </Select>
      )}
    </Field>
  );
}

export function Checkbox({
  label,
  className = '',
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: React.ReactNode }) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 text-small text-ink ${className}`}>
      <input type="checkbox" className="h-4 w-4 cursor-pointer rounded border-line-strong accent-primary" {...props} />
      {label}
    </label>
  );
}
