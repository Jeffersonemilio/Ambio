import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Building2, Users, Radio } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  useMyCompany,
  useUpdateMyCompany,
  useMyCompanyUsers,
  useCreateMyCompanyUser,
  useUpdateMyCompanyUser,
} from '../../hooks/useMyCompany';
import { TabsNav } from '../../components/common/TabsNav';
import { CompanyProfileHeader } from '../../components/company/CompanyProfileHeader';
import { CompanyInfoForm } from '../../components/company/CompanyInfoForm';
import { CompanyUsersManager } from '../../components/company/CompanyUsersManager';
import { CompanySensorsOverview } from '../../components/company/CompanySensorsOverview';

const tabs = [
  { id: 'info', label: 'Empresa', icon: Building2 },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'sensors', label: 'Sensores', icon: Radio },
];

export function CompanyProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');

  // Data hooks
  const { data: company, isLoading: isLoadingCompany } = useMyCompany();
  const { data: usersData, isLoading: isLoadingUsers } = useMyCompanyUsers();
  const updateCompany = useUpdateMyCompany();
  const createUser = useCreateMyCompanyUser();
  const updateUser = useUpdateMyCompanyUser();

  // Redirect if not a company user
  if (user?.userType !== 'company') {
    return <Navigate to="/" replace />;
  }

  // Permissions
  const isAdmin = user?.role === 'admin';
  const canViewUsers = ['admin', 'analyst'].includes(user?.role);

  // Filter tabs based on permissions
  const visibleTabs = tabs.filter((tab) => {
    if (tab.id === 'users' && !canViewUsers) return false;
    return true;
  });

  const handleUpdateCompany = async (data) => {
    await updateCompany.mutateAsync(data);
  };

  const handleCreateUser = async (data) => {
    await createUser.mutateAsync(data);
  };

  const handleUpdateUser = async ({ userId, data }) => {
    await updateUser.mutateAsync({ userId, data });
  };

  // Mock sensors data (você precisará criar um endpoint para isso)
  const sensors = [];

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <CompanyProfileHeader company={company} isLoading={isLoadingCompany} />

      <div className="mt-6">
        <TabsNav
          tabs={visibleTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          {activeTab === 'info' && (
            <CompanyInfoForm
              company={company}
              canEdit={isAdmin}
              onSave={handleUpdateCompany}
              isSaving={updateCompany.isPending}
            />
          )}

          {activeTab === 'users' && canViewUsers && (
            <CompanyUsersManager
              users={usersData?.data}
              isLoading={isLoadingUsers}
              canEdit={isAdmin}
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
              isCreating={createUser.isPending}
              isUpdating={updateUser.isPending}
            />
          )}

          {activeTab === 'sensors' && (
            <CompanySensorsOverview
              sensors={sensors}
              isLoading={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
