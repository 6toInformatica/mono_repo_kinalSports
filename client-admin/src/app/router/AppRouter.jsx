import { Routes, Route } from 'react-router-dom';
import { AuthPage } from '../../features/auth/pages/AuthPage.jsx';
import { ProtecterRoute } from './ProtecterRoute.jsx';
import { DashboardPage } from '../layouts/DashboardPage.jsx';
import { RoleGuard } from './RoleGuard.jsx';
import { Fields } from '../../features/fields/components/Fields.jsx';
import { Reservations } from '../../features/reservations/components/Reservations.jsx';
import { Teams } from '../../features/teams/components/Teams.jsx';
import { Tournaments } from '../../features/tournaments/components/Tournaments.jsx';
import { Users } from '../../features/users/components/Users.jsx';
import { VerifyEmailPage } from '../../features/auth/pages/VerifyEmailPage.jsx';
export const AppRouter = () => {
  return (
    <Routes>
      <Route path='/' element={<AuthPage />} />
      <Route path='/verify-email' element={<VerifyEmailPage />} />
      <Route
        path='/dashboard/*'
        element={
          <ProtecterRoute>
            <RoleGuard allowedRoles={['ADMIN_ROLE']}>
              <DashboardPage />
            </RoleGuard>
          </ProtecterRoute>
        }
      >
        <Route path='fields' element={<Fields />} />
        <Route path='reservations' element={<Reservations />} />
        <Route path='teams' element={<Teams />} />
        <Route path='tournaments' element={<Tournaments />} />
        <Route path='users' element={<Users />} />
      </Route>
    </Routes>
  );
};
