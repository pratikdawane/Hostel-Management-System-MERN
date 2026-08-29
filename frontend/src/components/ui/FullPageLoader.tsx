import { Loader2 } from 'lucide-react';

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" strokeWidth={1.8} />
    </div>
  );
}
