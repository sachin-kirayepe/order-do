import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
  labelClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, endIcon, className = '', labelClassName = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className={`block text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic px-1 ${labelClassName}`}>
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 
              ${icon ? 'pl-12' : ''} ${endIcon ? 'pr-12' : ''}
              text-white placeholder:text-slate-500 outline-none
              focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40
              transition-all duration-300 shadow-inner text-sm font-medium
              ${className}
            `}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors cursor-pointer">
              {endIcon}
            </div>
          )}
        </div>
        {error && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest px-1 animate-pulse">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
