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

          {/* Requiere autenticación */}
          <Route element={<ProtectedRoute />}>
            <Route path="/me" element={<ProfilePage />} />
          </Route>

          {/* Requiere ORGANIZER o ADMIN */}
          <Route element={<RoleRoute roles={['ORGANIZER', 'ADMIN']} />}>
            <Route path="/organizer" element={<OrganizerPage />} />
          </Route>

          {/* Requiere ADMIN */}
          <Route element={<RoleRoute roles={['ADMIN']} />}>
            <Route path="/admin/*" element={<div className="p-8">Panel de administración</div>} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
  );
}
