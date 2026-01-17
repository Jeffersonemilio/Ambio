import { ChevronDown } from 'lucide-react';

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  className = '',
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}
