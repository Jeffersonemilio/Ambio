import { Thermometer } from 'lucide-react';

export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <Thermometer className="w-10 h-10 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Ambio</span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-xl sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
