import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-bg)] px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <FileQuestion className="h-7 w-7" strokeWidth={1.8} />
      </div>
      <h1 className="text-xl font-semibold text-gray-900">Page not found</h1>
      <p className="max-w-sm text-sm text-gray-500">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link to="/">
        <Button variant="outline">Go home</Button>
      </Link>
    </div>
  );
}
