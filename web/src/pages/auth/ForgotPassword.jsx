import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { forgotPassword } from '../../api/auth';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError('Erro ao enviar email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Email enviado!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Se o email existir em nosso sistema, voce recebera instrucoes para redefinir sua senha.
          </p>
          <div className="mt-6">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar para o login
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 text-center">
          Recuperar senha
        </h2>
        <p className="mt-2 text-sm text-gray-600 text-center">
          Digite seu email para receber instrucoes de recuperacao
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

        <Button
          type="submit"
          loading={loading}
          className="w-full"
          size="lg"
        >
          Enviar instrucoes
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
