interface CustomLoaderProps {
  size?: number;
  className?: string;
}

export default function CustomLoader({ size = 50, className = '' }: CustomLoaderProps) {
  return (
    <div className={`loading ${className}`}>
      <svg height={size} width={size} viewBox="0 0 50 50">
        <polyline
          id="back"
          points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24"
        />
        <polyline
          id="front"
          points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24"
        />
      </svg>
    </div>
  );
}
