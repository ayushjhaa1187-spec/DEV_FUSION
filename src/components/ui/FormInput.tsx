import React from 'react';
import { cn } from './Button';
import { AlertCircle } from 'lucide-react';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(({
  className,
  label,
  error,
  helperText,
  required,
  disabled,
  ...props
}, ref) => {
  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label className="text-sm font-semibold text-text-primary mb-1">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          required={required}
          disabled={disabled}
          className={cn(
            'flex h-12 w-full rounded-xl border border-border-color bg-bg-primary px-4 py-2 text-sm text-text-primary ring-offset-bg-primary file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            error && 'border-error focus-visible:ring-error',
            className
          )}
          {...props}
        />
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error pointer-events-none">
            <AlertCircle size={18} />
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs font-semibold text-error mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-text-secondary mt-1">{helperText}</p>
      ) : null}
    </div>
  );
});

FormInput.displayName = 'FormInput';

// Separate Textarea component following same pattern
export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(({
  className,
  label,
  error,
  helperText,
  required,
  disabled,
  ...props
}, ref) => {
  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label className="text-sm font-semibold text-text-primary mb-1">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        required={required}
        disabled={disabled}
        className={cn(
          'flex min-h-[100px] w-full rounded-xl border border-border-color bg-bg-primary px-4 py-3 text-sm text-text-primary ring-offset-bg-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          error && 'border-error focus-visible:ring-error',
          className
        )}
        {...props}
      />

      {error ? (
        <p className="text-xs font-semibold text-error mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-text-secondary mt-1">{helperText}</p>
      ) : null}
    </div>
  );
});

FormTextarea.displayName = 'FormTextarea';
