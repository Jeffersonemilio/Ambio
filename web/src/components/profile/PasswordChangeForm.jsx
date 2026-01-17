import { useState } from 'react';
import { Lock, Eye, EyeOff, Check } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export function PasswordChangeForm({ onSubmit, isLoading = false }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validações
    if (!currentPassword) {
      setError('Informe a senha atual');
      return;
    }

    if (!newPassword) {
      setError('Informe a nova senha');
      return;
    }

    if (newPassword.length < 8) {
      setError('Nova senha deve ter no mínimo 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (currentPassword === newPassword) {
      setError('A nova senha deve ser diferente da atual');
      return;
    }

    try {
      await onSubmit({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Erro ao alterar senha');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="relative">
        <Input
          label="Senha atual"
          type={showCurrentPassword ? 'text' : 'password'}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          icon={Lock}
          placeholder="Digite sua senha atual"
        />
        <button
          type="button"
          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
        >
          {showCurrentPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="relative">
        <Input
          label="Nova senha"
          type={showNewPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          icon={Lock}
          placeholder="Mínimo 8 caracteres"
        />
        <button
          type="button"
          onClick={() => setShowNewPassword(!showNewPassword)}
          className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
        >
          {showNewPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>

      <Input
        label="Confirmar nova senha"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        icon={Lock}
        placeholder="Repita a nova senha"
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600 flex items-center gap-2">
          <Check className="h-4 w-4" />
          Senha alterada com sucesso!
        </div>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Alterando...' : 'Alterar senha'}
      </Button>
    </form>
  );
}
