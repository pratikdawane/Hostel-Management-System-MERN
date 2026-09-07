import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Input } from './Input';

interface SearchPickerProps<T> {
  label: string;
  placeholder: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  fetchOptions: (query: string) => Promise<T[]>;
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  getSubLabel: (item: T) => string;
  selected: T | null;
  onSelect: (item: T) => void;
  onClear: () => void;
  error?: string;
}

export function SearchPicker<T>({
  label,
  placeholder,
  icon: Icon,
  fetchOptions,
  getId,
  getLabel,
  getSubLabel,
  selected,
  onSelect,
  onClear,
  error,
}: SearchPickerProps<T>) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    const timeout = setTimeout(() => {
      setIsLoading(true);
      fetchOptions(query.trim())
        .then((result) => {
          if (!cancelled) setOptions(result);
        })
        .catch(() => {
          if (!cancelled) setOptions([]);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, isOpen, fetchOptions]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {selected ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Icon className="h-4 w-4" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{getLabel(selected)}</p>
              <p className="truncate text-xs text-gray-500">{getSubLabel(selected)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="flex-shrink-0 cursor-pointer text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <Input
            placeholder={placeholder}
            leftIcon={<Search className="h-4 w-4" strokeWidth={1.8} />}
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            error={error}
          />
          {isOpen && (
            <div className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 px-4 py-4 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  Searching...
                </div>
              ) : options.length === 0 ? (
                <p className="px-4 py-4 text-center text-sm text-gray-500">No matches found</p>
              ) : (
                <ul className="max-h-60 overflow-y-auto py-1">
                  {options.map((option) => (
                    <li key={getId(option)}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(option);
                          setIsOpen(false);
                          setQuery('');
                        }}
                        className="flex w-full cursor-pointer flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-gray-50"
                      >
                        <span className="text-sm font-medium text-gray-900">{getLabel(option)}</span>
                        <span className="text-xs text-gray-500">{getSubLabel(option)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
