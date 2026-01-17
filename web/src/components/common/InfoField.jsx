import { Pencil } from 'lucide-react';

export function InfoField({
  label,
  value,
  icon: Icon,
  editable = false,
  onEdit,
  emptyText = '-',
  className = '',
}) {
  const displayValue = value || emptyText;

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {Icon && (
        <div className="flex-shrink-0 mt-0.5">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 break-words">{displayValue}</dd>
      </div>
      {editable && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 transition-colors"
          title={`Editar ${label.toLowerCase()}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function InfoFieldGroup({ children, className = '' }) {
  return (
    <dl className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${className}`}>
      {children}
    </dl>
  );
}

export function InfoFieldDivider() {
  return <hr className="col-span-full border-gray-200 my-2" />;
}
