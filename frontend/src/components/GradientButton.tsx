import { ReactNode, ButtonHTMLAttributes } from 'react';
import './GradientButton.css';

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export default function GradientButton({ 
  children, 
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props 
}: GradientButtonProps) {
  const variantClass = `gradient-btn-${variant}`;
  const sizeClass = `btn-size-${size}`;
  
  return (
    <div className={`gradient-btn-wrapper ${fullWidth ? 'w-full' : ''}`}>
      <div className={`gradient-btn-container ${variantClass}`}>
        <button 
          className={`gradient-btn ${sizeClass} ${className}`}
          {...props}
        >
          {children}
        </button>
      </div>
    </div>
  );
}
