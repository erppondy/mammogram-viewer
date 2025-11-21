interface StatusBadgeProps {
  status: 'active' | 'pending' | 'inactive' | 'approved' | 'rejected';
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const getStatusClass = () => {
    switch (status) {
      case 'active':
      case 'approved':
        return 'status-active';
      case 'pending':
        return 'status-pending';
      case 'inactive':
      case 'rejected':
        return 'status-inactive';
      default:
        return 'status-inactive';
    }
  };

  const getBackgroundClass = () => {
    switch (status) {
      case 'active':
      case 'approved':
        return 'bg-green-900/20 border-green-500/50 text-green-400';
      case 'pending':
        return 'bg-yellow-900/20 border-yellow-500/50 text-yellow-400';
      case 'inactive':
      case 'rejected':
        return 'bg-gray-900/20 border-gray-500/50 text-gray-400';
      default:
        return 'bg-gray-900/20 border-gray-500/50 text-gray-400';
    }
  };

  const sizeClass = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : size === 'lg'
    ? 'text-sm px-4 py-2'
    : 'text-xs px-3 py-1';

  return (
    <span className={`inline-flex items-center ${sizeClass} rounded-full font-bold border ${getBackgroundClass()} uppercase tracking-wider`}>
      <span className={`status-indicator ${getStatusClass()}`}></span>
      {label}
    </span>
  );
}
