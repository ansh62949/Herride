import React from 'react';
import { motion } from 'framer-motion';

export default function Button({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  ...props 
}) {
  const baseStyle = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white focus:ring-primary shadow-lg shadow-primary/20',
    secondary: 'bg-secondary hover:bg-secondary-hover text-white focus:ring-secondary shadow-lg shadow-secondary/15',
    outline: 'bg-white border border-brandBorder hover:bg-slate-50 text-brandText focus:ring-slate-400',
    danger: 'bg-danger hover:bg-danger-dark text-white focus:ring-danger shadow-lg shadow-danger/20',
    ghost: 'bg-transparent hover:bg-slate-100 text-brandText-muted focus:ring-slate-400',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base rounded-3xl',
  };

  const disabledStyle = 'opacity-50 cursor-not-allowed shadow-none';

  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.98 }}
      whileHover={disabled ? {} : { y: -1 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${disabled ? disabledStyle : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
