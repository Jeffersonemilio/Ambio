import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500/20',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500/20',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500/20',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/20',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        focus:outline-none focus:ring-2 transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      {children}
    </button>
  );
}
