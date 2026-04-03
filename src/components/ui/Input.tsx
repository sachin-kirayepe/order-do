import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : Math.random().toString(36).substring(7));

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-sm">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`block w-full rounded-xl bg-white dark:bg-slate-900 border ${
              error ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-kirana-green focus:border-kirana-green'
            } ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 sm:text-sm transition-colors`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500" id={`${inputId}-error`}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
