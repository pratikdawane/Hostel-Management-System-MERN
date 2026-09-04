import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { registerAdminSchema, type RegisterAdminFormValues } from '@/lib/schemas';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/utils/errors';
import { AuthShell } from '@/layouts/AuthShell';

export function Setup() {
  const { registerAdmin } = useAuth();
  const navigate = useNavigate();
  const [alreadySetUp, setAlreadySetUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterAdminFormValues>({ resolver: zodResolver(registerAdminSchema) });

  const onSubmit = async (values: RegisterAdminFormValues) => {
    try {
      await registerAdmin({ ...values, phone: values.phone || undefined });
      toast.success('Admin account created. Welcome aboard!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 403) {
        setAlreadySetUp(true);
        return;
      }
      toast.error(getErrorMessage(error, 'Could not create the admin account'));
    }
  };

  if (alreadySetUp) {
    return (
      <AuthShell eyebrow="Almost there!" title="Setup Completed">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <ShieldCheck className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <p className="mb-6 text-sm text-gray-500">
            An admin account already exists for this hostel. Ask your administrator to create an
            account for you, then sign in below.
          </p>
          <Link to="/login">
            <Button className="w-full">Go to sign in</Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Get started!" title="Create Account">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <div>
          <label htmlFor="setup-name" className="sr-only">
            Full name
          </label>
          <div
            className={cn(
              'flex items-center gap-3 border-b-2 pb-2.5 transition-colors duration-150 focus-within:border-primary-500',
              errors.name ? 'border-red-300' : 'border-gray-200',
            )}
          >
            <UserIcon className="h-4 w-4 shrink-0 text-primary-500" strokeWidth={1.8} />
            <input
              id="setup-name"
              autoComplete="name"
              placeholder="Full name"
              aria-invalid={Boolean(errors.name)}
              className="w-full border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              {...register('name')}
            />
          </div>
          {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="setup-email" className="sr-only">
            Email address
          </label>
          <div
            className={cn(
              'flex items-center gap-3 border-b-2 pb-2.5 transition-colors duration-150 focus-within:border-primary-500',
              errors.email ? 'border-red-300' : 'border-gray-200',
            )}
          >
            <Mail className="h-4 w-4 shrink-0 text-primary-500" strokeWidth={1.8} />
            <input
              id="setup-email"
              type="email"
              autoComplete="email"
              placeholder="Email address"
              aria-invalid={Boolean(errors.email)}
              className="w-full border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              {...register('email')}
            />
          </div>
          {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="setup-phone" className="sr-only">
            Phone (optional)
          </label>
          <div
            className={cn(
              'flex items-center gap-3 border-b-2 pb-2.5 transition-colors duration-150 focus-within:border-primary-500',
              errors.phone ? 'border-red-300' : 'border-gray-200',
            )}
          >
            <Phone className="h-4 w-4 shrink-0 text-primary-500" strokeWidth={1.8} />
            <input
              id="setup-phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
              placeholder="Phone (optional)"
              aria-invalid={Boolean(errors.phone)}
              className="w-full border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              {...register('phone')}
            />
          </div>
          {errors.phone && <p className="mt-1.5 text-sm text-red-600">{errors.phone.message}</p>}
        </div>

        <div>
          <label htmlFor="setup-password" className="sr-only">
            Password
          </label>
          <div
            className={cn(
              'flex items-center gap-3 border-b-2 pb-2.5 transition-colors duration-150 focus-within:border-primary-500',
              errors.password ? 'border-red-300' : 'border-gray-200',
            )}
          >
            <Lock className="h-4 w-4 shrink-0 text-primary-500" strokeWidth={1.8} />
            <input
              id="setup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Password"
              aria-invalid={Boolean(errors.password)}
              className="w-full border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
              className="shrink-0 cursor-pointer text-gray-400 transition-colors duration-150 hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.8} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.8} />
              )}
            </button>
          </div>
          {errors.password ? (
            <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>
          ) : (
            <p className="mt-1.5 text-xs text-gray-400">
              At least 8 characters, with uppercase, lowercase and a number.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-700 text-base font-semibold text-white shadow-lg shadow-primary-500/30 transition-all duration-150 hover:from-primary-600 hover:to-primary-800 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
          Create admin account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already set up?{' '}
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
          Sign in instead
        </Link>
      </p>
    </AuthShell>
  );
}
