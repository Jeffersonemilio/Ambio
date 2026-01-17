import { AvatarUpload } from '../common/AvatarUpload';
import { Badge } from '../common/Badge';

const roleLabels = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  analyst: 'Analista',
  support: 'Suporte',
  user: 'Usuário',
};

const userTypeLabels = {
  ambio: 'Ambio',
  company: 'Empresa',
};

export function ProfileHeader({
  user,
  onAvatarUpload,
  onAvatarRemove,
  isUploadingAvatar = false,
}) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const avatarUrl = user?.avatarUrl ? `${apiUrl}${user.avatarUrl}` : null;

  const roleLabel = roleLabels[user?.role] || user?.role;
  const userTypeLabel = userTypeLabels[user?.userType] || user?.userType;

  return (
    <div className="flex items-center gap-6">
      <AvatarUpload
        currentAvatarUrl={avatarUrl}
        name={user?.name}
        onUpload={onAvatarUpload}
        onRemove={onAvatarRemove}
        isUploading={isUploadingAvatar}
        size="2xl"
      />

      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
        <p className="text-gray-500">{user?.email}</p>

        <div className="flex items-center gap-2 mt-2">
          <Badge variant={user?.userType === 'ambio' ? 'info' : 'default'}>
            {userTypeLabel}
          </Badge>
          <Badge variant="success">{roleLabel}</Badge>
          {user?.companyName && (
            <Badge variant="default">{user.companyName}</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
