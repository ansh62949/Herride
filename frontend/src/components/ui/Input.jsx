import React from 'react';

export default function Input({ 
  label, 
  error, 
  id, 
  type = 'text', 
  className = '', 
  iconBefore, 
  iconAfter,
  ...props 
}) {
  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-brandText-muted">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {iconBefore && (
          <div className="absolute left-3.5 text-slate-400">
            {iconBefore}
          </div>
        )}
        <input
          id={id}
          type={type}
          className={`w-full px-4 py-2.5 bg-slate-50 border rounded-2xl text-sm font-medium transition-all duration-200 outline-none
            ${iconBefore ? 'pl-10' : ''}
            ${iconAfter ? 'pr-10' : ''}
            ${error 
              ? 'border-danger focus:border-danger focus:ring-1 focus:ring-danger' 
              : 'border-brandBorder focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary'
            }
          `}
          {...props}
        />
        {iconAfter && (
          <div className="absolute right-3.5 text-slate-400">
            {iconAfter}
          </div>
        )}
      </div>
      {error && (
        <span className="text-[11px] font-semibold text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
