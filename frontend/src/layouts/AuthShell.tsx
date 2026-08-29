import type { ReactNode } from 'react';
import { Building2, CheckCircle2 } from 'lucide-react';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
}

const FEATURES = [
  'Room & bed allocation made simple',
  'Fee collection & payment tracking',
  'Staff and resident records in one place',
];

export function AuthShell({ eyebrow, title, children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-subtle)] px-4 py-8 sm:px-6 lg:py-12">
      <div className="relative flex w-full max-w-5xl animate-[fadeIn_200ms_ease] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl lg:h-[680px] lg:flex-row">
        <div className="relative flex shrink-0 flex-col justify-between gap-8 overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-indigo-700 px-8 py-10 sm:px-12 lg:w-[44%] lg:gap-0 lg:px-12 lg:py-12">
          <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 -bottom-32 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />
          <div
            className="pointer-events-none absolute bottom-8 left-8 hidden h-28 w-28 opacity-40 lg:block"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1.5px, transparent 1.5px)',
              backgroundSize: '10px 10px',
            }}
          />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm">
              <Building2 className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <span className="text-base font-semibold text-white">Hostel Management System</span>
          </div>

          <div className="relative z-10">
            <h1 className="max-w-sm text-2xl leading-snug font-semibold text-white sm:text-3xl">
              Simplify how you run your hostel
            </h1>
            <p className="mt-3 hidden max-w-sm text-base text-white/80 lg:block">
              One dashboard for rooms, residents, payments and staff — built to keep everyday
              operations effortless.
            </p>

            <ul className="mt-8 hidden flex-col gap-3 lg:flex">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm text-white/90">
                  <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 hidden text-xs text-white/60 lg:block">
            © {new Date().getFullYear()} Hostel Management System
          </p>
        </div>

        <div className="relative flex flex-1 items-center justify-center overflow-y-auto bg-white px-6 py-12 sm:px-10 lg:py-10">
          <svg
            className="pointer-events-none absolute top-0 left-0 hidden h-full w-36 -translate-x-full lg:block"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M100,0 C68,14 40,30 40,50 C40,70 68,86 100,100 Z" fill="white" />
            <path
              d="M96,4 C66,17 44,32 44,50 C44,68 66,83 96,96"
              fill="none"
              stroke="white"
              strokeOpacity="0.35"
              strokeWidth="1.5"
            />
          </svg>

          <div className="w-full max-w-sm">
            <p className="text-lg font-medium text-primary-600">{eyebrow}</p>
            <h2 className="mt-1 text-3xl font-bold text-gray-900 sm:text-4xl">{title}</h2>

            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
