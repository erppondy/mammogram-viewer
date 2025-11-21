interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export default function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizeClass = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-16 h-16' : 'w-10 h-10';
  
  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className={`medical-spinner ${sizeClass}`}></div>
      {message && (
        <p className="text-[var(--text-secondary)] text-sm">{message}</p>
      )}
    </div>
  );
}
