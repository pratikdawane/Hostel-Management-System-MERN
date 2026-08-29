import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Search } from 'lucide-react';
import * as userService from '@/services/userService';
import type { User, Role } from '@/types/auth';
import { ROLE_LABELS } from '@/types/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Select } from '@/components/ui/Select';
import { getErrorMessage } from '@/utils/errors';
import { CreateUserModal } from './CreateUserModal';

const PAGE_SIZE = 10;

export function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await userService.listUsers({
        page,
        limit: PAGE_SIZE,
        role: roleFilter || undefined,
      });
      setUsers(result.users);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load users'));
    } finally {
      setIsLoading(false);
    }
  }, [page, roleFilter]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user: User) => {
    setUpdatingId(user.id);
    try {
      const updated = await userService.setUserActiveStatus(user.id, !user.isActive);
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(`${updated.name} ${updated.isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update user status'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreated = (user: User) => {
    setIsModalOpen(false);
    toast.success(`${user.name} added as ${ROLE_LABELS[user.role]}`);
    setPage(1);
    void fetchUsers();
  };

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_200ms_ease]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Manage users</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} account{total === 1 ? '' : 's'} in total
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" strokeWidth={1.8} />}
          onClick={() => setIsModalOpen(true)}
        >
          Add user
        </Button>
      </div>

      <div className="w-full sm:w-48">
        <Select
          aria-label="Filter by role"
          value={roleFilter}
          onChange={(event) => {
            setRoleFilter(event.target.value as Role | '');
            setPage(1);
          }}
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Hostel Manager</option>
          <option value="resident">Resident</option>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col gap-3 p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-gray-500">{error}</p>
            <Button variant="outline" onClick={() => void fetchUsers()}>
              Try again
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Search className="h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="text-sm text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors duration-150 hover:bg-gray-50/60"
                  >
                    <td className="px-6 py-3.5 font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-3.5 text-gray-600">{user.email}</td>
                    <td className="px-6 py-3.5">
                      <Badge variant="primary">{ROLE_LABELS[user.role]}</Badge>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={user.isActive ? 'success' : 'neutral'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant={user.isActive ? 'outline' : 'secondary'}
                        isLoading={updatingId === user.id}
                        onClick={() => void handleToggleStatus(user)}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
