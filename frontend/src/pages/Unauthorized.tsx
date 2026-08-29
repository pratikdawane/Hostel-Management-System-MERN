import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-bg)] px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <ShieldAlert className="h-7 w-7" strokeWidth={1.8} />
      </div>
      <h1 className="text-xl font-semibold text-gray-900">Access denied</h1>
      <p className="max-w-sm text-sm text-gray-500">
        You don&apos;t have permission to view this page. Contact your administrator if you think
        this is a mistake.
      </p>
      <Link to="/dashboard">
        <Button variant="outline">Back to dashboard</Button>
      </Link>
    </div>
  );
}
