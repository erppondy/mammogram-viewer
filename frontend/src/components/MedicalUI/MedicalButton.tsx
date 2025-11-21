import { ReactNode, ButtonHTMLAttributes } from 'react';

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
  const variantClass = variant === 'secondary' 
    ? 'medical-button-secondary' 
    : variant === 'danger'
    ? 'medical-button-danger'
    : 'medical-button';
  
  const sizeClass = size === 'sm' 
    ? 'text-xs py-2 px-4' 
    : size === 'lg'
    ? 'text-base py-4 px-8'
    : '';
  
  return (
    <button 
      className={`${variantClass} ${fullWidth ? 'w-full' : ''} ${sizeClass} ${className} flex items-center justify-center gap-2`}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="inline-flex">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="inline-flex">{icon}</span>}
    </button>
  );
}
