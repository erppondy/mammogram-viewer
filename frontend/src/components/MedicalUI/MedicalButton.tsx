import { ReactNode, ButtonHTMLAttributes } from 'react';
import './MedicalButton.css';

interface MedicalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
}

export default function MedicalButton({ 
  children, 
  variant = 'primary',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  size = 'md',
  className = '',
  ...props 
}: MedicalButtonProps) {
  const sizeClass = size === 'sm' 
    ? 'btn-sm' 
    : size === 'lg'
    ? 'btn-lg'
    : 'btn-md';
  
  const variantClass = variant === 'secondary' 
    ? 'gradient-btn-secondary' 
    : variant === 'danger'
    ? 'gradient-btn-danger'
    : 'gradient-btn-primary';
  
  return (
    <div className={`gradient-button-container ${fullWidth ? 'w-full' : ''}`}>
      <div className={`gradient-container ${variantClass}`}>
        <button 
          className={`gradient-button ${sizeClass} ${className}`}
          {...props}
        >
          {icon && iconPosition === 'left' && <span className="inline-flex">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="inline-flex">{icon}</span>}
        </button>
      </div>
    </div>
  );
}
