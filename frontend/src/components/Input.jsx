import { forwardRef } from 'react';
import { cn } from '../utils/cn';

export const Input = forwardRef(({
  label,
  error,
  helperText,
  id,
  className,
  containerClassName,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  disabled,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={cn('flex flex-col space-y-1.5 w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="absolute left-3 pointer-events-none text-slate-400">
            <LeftIcon className="h-4 w-4" />
          </div>
        )}

        <input
          id={inputId}
          ref={ref}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
            LeftIcon && 'pl-9',
            RightIcon && 'pr-9',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />

        {RightIcon && (
          <div className="absolute right-3 pointer-events-none text-slate-400">
            <RightIcon className="h-4 w-4" />
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
