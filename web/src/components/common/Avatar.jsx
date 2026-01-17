import { User } from 'lucide-react';

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-20 w-20 text-2xl',
};

const iconSizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
  '2xl': 'h-10 w-10',
};

function getInitials(name) {
  if (!name) return '';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorFromName(name) {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
  ];

  if (!name) return colors[0];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  src,
  name,
  size = 'md',
  className = '',
  showInitials = true,
}) {
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const iconSize = iconSizeClasses[size] || iconSizeClasses.md;
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    );
  }

  if (showInitials && initials) {
    return (
      <div
        className={`${sizeClass} ${bgColor} rounded-full flex items-center justify-center text-white font-medium ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} bg-gray-200 rounded-full flex items-center justify-center ${className}`}
    >
      <User className={`${iconSize} text-gray-500`} />
    </div>
  );
}
