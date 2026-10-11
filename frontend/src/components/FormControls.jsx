// Labelled form inputs that show validation errors under the field
import { useId } from 'react';

function Field({ id, label, error, hint, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="label">{label}</label>}
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-rose-600" id={`${id}-error`}>{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>
      )}
    </div>
  );
}

export function TextInput({ label, error, hint, className, suffix, ...props }) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} hint={hint} className={className}>
      <div className="relative">
        <input
          id={id}
          className={`input ${suffix ? 'pr-12' : ''}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {suffix && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-ink-faint">{suffix}</span>}
      </div>
    </Field>
  );
}

export function SelectInput({ label, error, hint, options, placeholder, className, ...props }) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} hint={hint} className={className}>
      <select id={id} className="input" aria-invalid={error ? 'true' : 'false'} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) =>
          typeof option === 'string' ? (
            <option key={option} value={option}>{option}</option>
          ) : (
            <option key={option.value} value={option.value}>{option.label}</option>
          )
        )}
      </select>
    </Field>
  );
}

export function TextArea({ label, error, hint, className, ...props }) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} hint={hint} className={className}>
      <textarea id={id} className="input min-h-[80px] resize-y" aria-invalid={error ? 'true' : 'false'} {...props} />
    </Field>
  );
}
