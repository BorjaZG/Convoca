import { Route, Routes } from 'react-router-dom';

import { RootLayout } from '@/components/layout/RootLayout';
import { HomePage } from '@/pages/HomePage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
