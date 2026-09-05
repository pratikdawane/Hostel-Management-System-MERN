import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { GuestRoute } from '@/components/GuestRoute';
import { RoleGuard } from '@/components/RoleGuard';
import { Login } from '@/pages/Login';
import { Setup } from '@/pages/Setup';
import { Dashboard } from '@/pages/Dashboard';
import { ChangePassword } from '@/pages/ChangePassword';
import { ManageUsers } from '@/pages/admin/ManageUsers';
import { ResidentsList } from '@/pages/residents/ResidentsList';
import { ResidentForm } from '@/pages/residents/ResidentForm';
import { ResidentDetail } from '@/pages/residents/ResidentDetail';
import { RoomsList } from '@/pages/rooms/RoomsList';
import { RoomForm } from '@/pages/rooms/RoomForm';
import { RoomDetail } from '@/pages/rooms/RoomDetail';
import { Unauthorized } from '@/pages/Unauthorized';
import { NotFound } from '@/pages/NotFound';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<Setup />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/change-password" element={<ChangePassword />} />

          <Route element={<RoleGuard allow={['admin']} />}>
            <Route path="/admin/users" element={<ManageUsers />} />
          </Route>

          <Route element={<RoleGuard allow={['admin', 'manager']} />}>
            <Route path="/residents" element={<ResidentsList />} />
            <Route path="/residents/new" element={<ResidentForm mode="create" />} />
            <Route path="/residents/:id" element={<ResidentDetail />} />
            <Route path="/residents/:id/edit" element={<ResidentForm mode="edit" />} />
            <Route path="/rooms" element={<RoomsList />} />
            <Route path="/rooms/new" element={<RoomForm mode="create" />} />
            <Route path="/rooms/:id" element={<RoomDetail />} />
            <Route path="/rooms/:id/edit" element={<RoomForm mode="edit" />} />
          </Route>
        </Route>
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
