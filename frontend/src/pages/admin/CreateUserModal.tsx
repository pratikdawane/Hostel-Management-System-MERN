import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, Phone, User as UserIcon } from 'lucide-react';
import { createUserSchema, type CreateUserFormValues } from '@/lib/schemas';
import * as userService from '@/services/userService';
import type { User } from '@/types/auth';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/utils/errors';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (user: User) => void;
}

export function CreateUserModal({ isOpen, onClose, onCreated }: CreateUserModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'resident' },
  });

  const onSubmit = async (values: CreateUserFormValues) => {
    try {
      const user = await userService.createUser({ ...values, phone: values.phone || undefined });
      reset();
      onCreated(user);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not create user'));
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add user">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input
          label="Full name"
          leftIcon={<UserIcon className="h-4 w-4" strokeWidth={1.8} />}
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Email address"
          type="email"
          leftIcon={<Mail className="h-4 w-4" strokeWidth={1.8} />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Phone (optional)"
          type="tel"
          leftIcon={<Phone className="h-4 w-4" strokeWidth={1.8} />}
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Select label="Role" error={errors.role?.message} {...register('role')}>
          <option value="resident">Resident</option>
          <option value="manager">Hostel Manager</option>
          <option value="admin">Admin</option>
        </Select>
        <PasswordInput
          label="Initial password"
          autoComplete="new-password"
          hint="Share this with the new user securely. They can change it after signing in."
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create user
          </Button>
        </div>
      </form>
    </Modal>
  );
}
