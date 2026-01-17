export function Input({
  label,
  type = 'text',
  error,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          type={type}
          className={`
            block w-full rounded-lg border px-3 py-2 text-gray-900
            placeholder:text-gray-400 focus:outline-none focus:ring-2
            ${Icon ? 'pl-10' : ''}
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
            }
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
