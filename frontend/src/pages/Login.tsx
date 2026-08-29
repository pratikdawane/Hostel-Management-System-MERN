import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginFormValues } from '@/lib/schemas';
import { cn } from '@/lib/cn';
import { getErrorMessage } from '@/utils/errors';
import { AuthShell } from '@/layouts/AuthShell';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values);
      const from =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
        '/dashboard';
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Invalid email or password'));
    }
  };

  return (
    <AuthShell eyebrow="Hello there!" title="Welcome Back">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-7" noValidate>
        <div>
          <label htmlFor="login-email" className="sr-only">
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
              id="login-email"
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
          <label htmlFor="login-password" className="sr-only">
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
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
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
          {errors.password && (
            <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-3 flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-700 text-base font-semibold text-white shadow-lg shadow-primary-500/30 transition-all duration-150 hover:from-primary-600 hover:to-primary-800 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
          Sign in
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-500">
        Setting up for the first time?{' '}
        <Link to="/setup" className="font-medium text-primary-600 hover:text-primary-700">
          Create the admin account
        </Link>
      </p>
    </AuthShell>
  );
}
