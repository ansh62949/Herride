import React from 'react';

export default function Badge({ children, variant = 'neutral', className = '' }) {
  const baseStyle = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border';

  const variants = {
    primary: 'bg-primary-light text-primary-dark border-primary/20',
    secondary: 'bg-secondary-light text-secondary-dark border-secondary/20',
    success: 'bg-success-light text-success-dark border-success/20',
    danger: 'bg-danger-light text-danger-dark border-danger/20',
    accent: 'bg-accent-light text-accent-dark border-accent/20',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
