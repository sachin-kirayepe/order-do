import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children?: React.ReactNode;
  className?: string;
  hover?: boolean;
  intensity?: 'low' | 'medium' | 'high';
  onClick?: () => void;
}

export default function GlassCard({ 
  children, 
  className = '', 
  hover = true,
  intensity = 'medium',
  onClick 
}: GlassCardProps) {
  
  const intensityStyles = {
    low: "bg-white/40 dark:bg-slate-900/10 border-white/20 dark:border-white/5",
    medium: "bg-white/60 dark:bg-slate-900/20 border-white/30 dark:border-white/10",
    high: "bg-white/80 dark:bg-slate-900/40 border-white/40 dark:border-white/20 shadow-premium"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover && onClick ? { y: -4, transition: { duration: 0.2 } } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        backdrop-blur-2xl rounded-card border
        ${intensityStyles[intensity]}
        ${hover ? 'hover:shadow-2xl hover:bg-white/70 dark:hover:bg-slate-900/30 transition-all duration-300' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
