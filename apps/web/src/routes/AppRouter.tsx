import { Route, Routes } from 'react-router-dom';

import { RootLayout } from '@/components/layout/RootLayout';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { EventsPage } from '@/pages/events/EventsPage';
import { EventDetailPage } from '@/pages/events/EventDetailPage';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { OrganizerPage } from '@/pages/organizer/OrganizerPage';
import { OrganizerDashboardPage } from '@/pages/organizer/OrganizerDashboardPage';
import { OrganizerEventNewPage } from '@/pages/organizer/OrganizerEventNewPage';
import { OrganizerEventEditPage } from '@/pages/organizer/OrganizerEventEditPage';
import { UserDashboardPage } from '@/pages/user/UserDashboardPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        {/* Públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        {/* Requiere autenticación (cualquier rol) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/me" element={<ProfilePage />} />
          <Route path="/me/dashboard" element={<UserDashboardPage />} />
        </Route>

        {/* Requiere ORGANIZER o ADMIN */}
        <Route element={<RoleRoute roles={['ORGANIZER', 'ADMIN']} />}>
          <Route path="/organizer" element={<OrganizerPage />} />
          <Route path="/organizer/dashboard" element={<OrganizerDashboardPage />} />
          {/* /new antes de /:id/edit para evitar colisión de rutas */}
          <Route path="/organizer/events/new" element={<OrganizerEventNewPage />} />
          <Route path="/organizer/events/:id/edit" element={<OrganizerEventEditPage />} />
        </Route>

        {/* Requiere ADMIN */}
        <Route element={<RoleRoute roles={['ADMIN']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
