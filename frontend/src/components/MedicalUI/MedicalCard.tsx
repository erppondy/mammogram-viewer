import { ReactNode } from 'react';

interface MedicalCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  scanLine?: boolean;
  title?: string;
  icon?: ReactNode;
}

export default function MedicalCard({ 
  children, 
  className = '', 
  hover = true,
  scanLine = false,
  title,
  icon
}: MedicalCardProps) {
  return (
    <div 
      className={`medical-card ${hover ? 'hover:border-glow' : ''} ${scanLine ? 'scan-line-container' : ''} ${className}`}
    >
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--border-color)]">
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--medical-primary)] to-[var(--medical-primary-dark)] flex items-center justify-center">
              {icon}
            </div>
          )}
          {title && (
            <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-wide">
              {title}
            </h3>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
