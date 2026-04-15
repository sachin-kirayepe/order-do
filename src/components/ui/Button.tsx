import React from 'react';
import Loader from './Loader';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Button({ 
  variant = 'primary', 
  isLoading = false, 
  size = 'md',
  className = '', 
  children, 
  disabled, 
  ...props 
}: ButtonProps) {
  
  const baseClasses = "relative inline-flex items-center justify-center font-black uppercase italic tracking-widest whitespace-nowrap transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed rounded-button select-none active:scale-[0.96]";
  
  const sizes = {
    sm: "px-4 py-2 text-[10px]",
    md: "px-6 py-3.5 text-xs",
    lg: "px-8 py-4 text-sm"
  };

  const variants = {
    primary: "bg-brand-primary text-white hover:brightness-110 shadow-glow-green border border-white/10",
    secondary: "bg-brand-secondary text-white hover:brightness-110 shadow-glow-orange border border-white/10",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20",
    outline: "border-2 border-slate-200 dark:border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 text-slate-800 dark:text-white",
    ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
  };

  return (
    <button 
      className={`${baseClasses} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader className="mr-3 scale-75" />
      ) : null}
      <span className={`flex items-center gap-2 ${isLoading ? 'opacity-50' : ''}`}>
        {children}
      </span>
      
      {/* Liquid Inner Highlight */}
      <span className="absolute inset-0 rounded-button bg-gradient-to-t from-black/10 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
    </button>
  );
}
