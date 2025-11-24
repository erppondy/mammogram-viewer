import CustomLoader from '../CustomLoader';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export default function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const loaderSize = size === 'sm' ? 30 : size === 'lg' ? 60 : 45;
  
  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <CustomLoader size={loaderSize} />
      {message && (
        <p className="text-[var(--text-secondary)] text-sm">{message}</p>
      )}
    </div>
  );
}
