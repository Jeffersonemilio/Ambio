import { useRef, useState } from 'react';
import { Camera, X, Upload, Loader2 } from 'lucide-react';
import { Avatar } from './Avatar';

export function AvatarUpload({
  currentAvatarUrl,
  name,
  onUpload,
  onRemove,
  isUploading = false,
  size = 'xl',
  className = '',
}) {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Formato inválido. Use JPG, PNG ou WebP.');
      return;
    }

    // Validar tamanho (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 2MB.');
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);

    // Chamar callback de upload
    if (onUpload) {
      onUpload(file);
    }

    // Limpar input
    e.target.value = '';
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setError(null);
    if (onRemove) {
      onRemove();
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;
  const hasAvatar = !!displayUrl;

  return (
    <div className={`relative inline-block ${className}`}>
      <Avatar
        src={displayUrl}
        name={name}
        size={size}
        className={isUploading ? 'opacity-50' : ''}
      />

      {/* Overlay de loading */}
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        </div>
      )}

      {/* Botões de ação */}
      {!isUploading && (
        <div className="absolute -bottom-1 -right-1 flex gap-1">
          {/* Botão de upload/trocar */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition-colors"
            title={hasAvatar ? 'Trocar foto' : 'Adicionar foto'}
          >
            {hasAvatar ? (
              <Camera className="h-3.5 w-3.5" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Botão de remover */}
          {hasAvatar && onRemove && (
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 bg-red-600 text-white rounded-full shadow-md hover:bg-red-700 transition-colors"
              title="Remover foto"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Mensagem de erro */}
      {error && (
        <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-red-600 whitespace-nowrap">
          {error}
        </p>
      )}
    </div>
  );
}
