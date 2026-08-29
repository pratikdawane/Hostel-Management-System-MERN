/**
 * Soft-UI ("neumorphic") shadow utilities for the admin dashboard shell
 * (DashboardLayout + Dashboard page) only — not used by any other screen.
 * Colors come from the --color-neu-* tokens in index.css.
 */
export const NEU_RAISED =
  'shadow-[6px_6px_12px_var(--color-neu-shadow-dark),-6px_-6px_12px_var(--color-neu-shadow-light)]';

export const NEU_PRESSED =
  'shadow-[inset_4px_4px_8px_var(--color-neu-shadow-dark),inset_-4px_-4px_8px_var(--color-neu-shadow-light)]';

export const NEU_PRESS_ON_ACTIVE =
  'active:shadow-[inset_3px_3px_6px_var(--color-neu-shadow-dark),inset_-3px_-3px_6px_var(--color-neu-shadow-light)] active:translate-y-0';
