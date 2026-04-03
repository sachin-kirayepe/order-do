import React from 'react';
import Loader from './Loader';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  children: React.ReactNode;
}

export default function Button({ 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  children, 
  disabled, 
  ...props 
}: ButtonProps) {
  
  const baseClasses = "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-4 py-2";
  
  const variants = {
    primary: "bg-kirana-green hover:bg-kirana-dark text-white focus:ring-kirana-green shadow-sm",
    secondary: "bg-kirana-orange hover:bg-orange-600 text-white focus:ring-kirana-orange shadow-sm",
    outline: "border-2 border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200",
    ghost: "bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader className="mr-2" /> : null}
      <span className={isLoading ? 'opacity-80' : ''}>{children}</span>
    </button>
  );
}
