import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.status === 401) {
        setError('Email ou senha incorretos');
      } else if (err.status === 403) {
        setError('Sua conta esta inativa. Entre em contato com o suporte.');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 text-center">
          Entrar na sua conta
        </h2>
        <p className="mt-2 text-sm text-gray-600 text-center">
          Acesse o painel de gestao Ambio
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          icon={Mail}
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <Input
          label="Senha"
          type="password"
          icon={Lock}
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Esqueceu sua senha?
          </Link>
        </div>

        <Button
          type="submit"
          loading={loading}
          className="w-full"
          size="lg"
        >
          Entrar
        </Button>
      </form>
    </AuthLayout>
  );
}
