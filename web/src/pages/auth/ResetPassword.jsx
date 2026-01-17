import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { resetPassword } from '../../api/auth';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errors = {};

    if (password.length < 8) {
      errors.password = 'A senha deve ter no minimo 8 caracteres';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'As senhas nao coincidem';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      if (err.status === 400) {
        setError('Token invalido ou expirado. Solicite uma nova recuperacao de senha.');
      } else {
        setError('Erro ao redefinir senha. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Link invalido
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            O link de recuperacao de senha e invalido ou expirou.
          </p>
          <div className="mt-6">
            <Link
              to="/forgot-password"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Solicitar nova recuperacao
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Senha alterada!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sua senha foi redefinida com sucesso. Voce ja pode fazer login.
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate('/login')} size="lg">
              Ir para o login
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 text-center">
          Redefinir senha
        </h2>
        <p className="mt-2 text-sm text-gray-600 text-center">
          Digite sua nova senha
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Input
          label="Nova senha"
          type="password"
          icon={Lock}
          placeholder="Minimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
          autoComplete="new-password"
        />

        <Input
          label="Confirmar senha"
          type="password"
          icon={Lock}
          placeholder="Repita a senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
          required
          autoComplete="new-password"
        />

        <Button
          type="submit"
          loading={loading}
          className="w-full"
          size="lg"
        >
          Redefinir senha
        </Button>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar para o login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
