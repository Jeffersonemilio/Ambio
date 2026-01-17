import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Thermometer, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const roleLabels = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  analyst: 'Analista',
  support: 'Suporte',
  user: 'Usuario',
};

export function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isAmbioUser = user?.userType === 'ambio';
  const isAdmin = ['super_admin', 'admin'].includes(user?.role);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const linkClasses = (path) =>
    `font-medium ${
      isActive(path)
        ? 'text-blue-600'
        : 'text-gray-600 hover:text-gray-900'
    }`;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Thermometer className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">Ambio</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/" className={linkClasses('/')}>
            Dashboard
          </Link>
          <Link to="/sensors" className={linkClasses('/sensors')}>
            Sensores
          </Link>
          <Link to="/readings" className={linkClasses('/readings')}>
            Leituras
          </Link>
          {(isAmbioUser || isAdmin) && (
            <Link to="/users" className={linkClasses('/users')}>
              Usuarios
            </Link>
          )}
          {isAmbioUser && (
            <Link to="/companies" className={linkClasses('/companies')}>
              Empresas
            </Link>
          )}

          {/* User menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium">{user?.name}</div>
                <div className="text-xs text-gray-500">
                  {roleLabels[user?.role] || user?.role}
                </div>
              </div>
              <ChevronDown className="w-4 h-4" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                  <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
