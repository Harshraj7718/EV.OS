"use client";

import { useEffect, useState } from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Debounced search box — commits to `onChange` 300ms after typing stops,
 * so callers can wire it straight to a fetch without debouncing themselves. */
export function SearchInput({ value, onChange, placeholder = "Search…" }: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  // "Adjusting state when a prop changes" — React's documented pattern for
  // this (https://react.dev/learn/you-might-not-need-an-effect), not a
  // useEffect: lets a caller reset the value externally (e.g. a future
  // "clear filters" button) without an effect-based sync.
  if (value !== lastValue) {
    setLastValue(value);
    setLocal(value);
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <input
      type="search"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      placeholder={placeholder}
      className="w-full max-w-xs rounded-lg border border-brand-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
    />
  );
}
