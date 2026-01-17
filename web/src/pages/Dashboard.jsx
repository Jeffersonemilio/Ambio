import { useAuth } from '../hooks/useAuth';
import { AdminDashboard } from './dashboard/AdminDashboard';
import { CompanyDashboard } from './dashboard/CompanyDashboard';

export function Dashboard() {
  const { user } = useAuth();
  const isAmbioUser = user?.userType === 'ambio';

  if (isAmbioUser) {
    return <AdminDashboard />;
  }

  return <CompanyDashboard companyId={user?.companyId} />;
}
