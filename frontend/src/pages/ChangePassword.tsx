import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { changePasswordSchema, type ChangePasswordFormValues } from '@/lib/schemas';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { getErrorMessage } from '@/utils/errors';

export function ChangePassword() {
  const { changePassword } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    try {
      await changePassword(values);
      toast.success('Password changed. Your other sessions have been signed out.');
      reset();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not change your password'));
    }
  };

  return (
    <div className="mx-auto max-w-lg animate-[fadeIn_200ms_ease]">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Change password</h1>
      <Card>
        <CardHeader>
          <p className="text-sm text-gray-500">
            Changing your password will sign you out of all other devices.
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <PasswordInput
              label="Current password"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
            <PasswordInput
              label="New password"
              autoComplete="new-password"
              hint="At least 8 characters, with uppercase, lowercase and a number."
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <PasswordInput
              label="Confirm new password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Button type="submit" isLoading={isSubmitting} className="mt-2 self-start">
              Update password
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
