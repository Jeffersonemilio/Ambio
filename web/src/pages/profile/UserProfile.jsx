import { useState } from 'react';
import { User, Lock, Bell } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { TabsNav, TabPanel } from '../../components/common/TabsNav';
import { Loading } from '../../components/common/Loading';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { PersonalInfoForm } from '../../components/profile/PersonalInfoForm';
import { PasswordChangeForm } from '../../components/profile/PasswordChangeForm';
import { NotificationSettings } from '../../components/profile/NotificationSettings';
import { useAuth } from '../../hooks/useAuth';
import {
  useUpdateProfile,
  useUploadAvatar,
  useRemoveAvatar,
  useChangePassword,
} from '../../hooks/useProfile';
import { usePreferences, useUpdatePreferences } from '../../hooks/usePreferences';

const tabs = [
  { id: 'personal', label: 'Informações Pessoais', icon: User },
  { id: 'security', label: 'Segurança', icon: Lock },
  { id: 'preferences', label: 'Preferências', icon: Bell },
];

export function UserProfile() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');

  // Mutations
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();
  const changePassword = useChangePassword();

  // Preferences
  const { data: preferences, isLoading: isLoadingPreferences } = usePreferences();
  const updatePreferences = useUpdatePreferences();

  const handleProfileSave = async (data) => {
    await updateProfile.mutateAsync(data);
    if (refreshUser) {
      await refreshUser();
    }
  };

  const handleAvatarUpload = async (file) => {
    await uploadAvatar.mutateAsync(file);
    if (refreshUser) {
      await refreshUser();
    }
  };

  const handleAvatarRemove = async () => {
    await removeAvatar.mutateAsync();
    if (refreshUser) {
      await refreshUser();
    }
  };

  const handlePasswordChange = async (data) => {
    await changePassword.mutateAsync(data);
  };

  const handlePreferencesSave = async (data) => {
    await updatePreferences.mutateAsync(data);
  };

  if (!user) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <ProfileHeader
          user={user}
          onAvatarUpload={handleAvatarUpload}
          onAvatarRemove={handleAvatarRemove}
          isUploadingAvatar={uploadAvatar.isPending}
        />
      </Card>

      {/* Tabs */}
      <Card className="p-0">
        <div className="px-6 pt-4">
          <TabsNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="px-6 pb-6">
          <TabPanel isActive={activeTab === 'personal'}>
            <PersonalInfoForm
              user={user}
              onSave={handleProfileSave}
              isSaving={updateProfile.isPending}
            />
          </TabPanel>

          <TabPanel isActive={activeTab === 'security'}>
            <div className="max-w-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Alterar senha
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Para sua segurança, recomendamos usar uma senha forte com pelo menos 8 caracteres,
                incluindo letras, números e símbolos.
              </p>
              <PasswordChangeForm
                onSubmit={handlePasswordChange}
                isLoading={changePassword.isPending}
              />
            </div>
          </TabPanel>

          <TabPanel isActive={activeTab === 'preferences'}>
            {isLoadingPreferences ? (
              <Loading />
            ) : (
              <NotificationSettings
                preferences={preferences}
                onSave={handlePreferencesSave}
                isSaving={updatePreferences.isPending}
              />
            )}
          </TabPanel>
        </div>
      </Card>
    </div>
  );
}
