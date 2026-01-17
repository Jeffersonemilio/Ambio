import { AlertCircle } from 'lucide-react';

export function ErrorMessage({ message = 'Ocorreu um erro ao carregar os dados.' }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <p>{message}</p>
    </div>
  );
}
