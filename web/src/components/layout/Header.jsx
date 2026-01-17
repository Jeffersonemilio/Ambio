import { Link } from 'react-router-dom';
import { Thermometer } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Thermometer className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">Ambio</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium">
            Dashboard
          </Link>
          <Link to="/sensors" className="text-gray-600 hover:text-gray-900 font-medium">
            Sensores
          </Link>
          <Link to="/readings" className="text-gray-600 hover:text-gray-900 font-medium">
            Leituras
          </Link>
        </nav>
      </div>
    </header>
  );
}
