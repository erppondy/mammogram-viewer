import { InputHTMLAttributes } from 'react';

interface MedicalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function MedicalInput({ 
  label, 
  error,
  className = '',
  ...props 
}: MedicalInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="data-label block mb-2">
          {label}
        </label>
      )}
      <input 
        className={`medical-input w-full ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}
