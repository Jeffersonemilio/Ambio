import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Sensors } from './pages/Sensors';
import { SensorDetail } from './pages/SensorDetail';
import { Readings } from './pages/Readings';
import { Login } from './pages/auth/Login';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { UsersList } from './pages/users/UsersList';
import { UserForm } from './pages/users/UserForm';
import { CompaniesList } from './pages/companies/CompaniesList';
import { CompanyForm } from './pages/companies/CompanyForm';
import { CompanyDetail } from './pages/companies/CompanyDetail';
import { SensorAssignment } from './pages/sensors/SensorAssignment';
import { UserProfile } from './pages/profile/UserProfile';
import { CompanyProfile } from './pages/company/CompanyProfile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/sensors" element={<Sensors />} />
                  <Route path="/sensors/assignment" element={<SensorAssignment />} />
                  <Route path="/sensors/:serialNumber" element={<SensorDetail />} />
                  <Route path="/readings" element={<Readings />} />
                  <Route path="/users" element={<UsersList />} />
                  <Route path="/users/new" element={<UserForm />} />
                  <Route path="/users/:id" element={<UserForm />} />
                  <Route path="/companies" element={<CompaniesList />} />
                  <Route path="/companies/new" element={<CompanyForm />} />
                  <Route path="/companies/:id" element={<CompanyDetail />} />
                  <Route path="/companies/:id/edit" element={<CompanyForm />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/company/profile" element={<CompanyProfile />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
