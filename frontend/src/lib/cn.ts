type ClassValue =
  | string
  | number
  | bigint
  | false
  | null
  | undefined
  | Record<string, boolean | undefined>;

export function cn(...values: ClassValue[]): string {
  const classes: string[] = [];

  for (const value of values) {
    if (!value) continue;

    if (typeof value === 'string' || typeof value === 'number') {
      classes.push(String(value));
      continue;
    }

    for (const [key, condition] of Object.entries(value)) {
      if (condition) classes.push(key);
    }
  }

  return classes.join(' ');
}
