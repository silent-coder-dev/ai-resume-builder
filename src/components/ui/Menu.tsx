'use client';

import React, { useEffect, useId, useRef, useState } from 'react';

export type MenuEntry =
  | {
      label: string;
      icon?: React.ComponentType<{ className?: string }>;
      onSelect: () => void;
      danger?: boolean;
      disabled?: boolean;
    }
  | 'separator';

interface MenuProps {
  label: string;
  entries: MenuEntry[];
  align?: 'start' | 'end';
  trigger: (props: {
    'aria-haspopup': 'menu';
    'aria-expanded': boolean;
    'aria-controls': string;
    'aria-label': string;
    onClick: () => void;
    ref: React.Ref<HTMLButtonElement>;
  }) => React.ReactNode;
}

// A small accessible dropdown menu: arrow keys move, Esc closes, focus returns.
export function Menu({ label, entries, align = 'end', trigger }: MenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const firstItem = listRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)');
    firstItem?.focus();
    const closeOnOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutside);
    return () => document.removeEventListener('mousedown', closeOnOutside);
  }, [open]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = [...(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [])];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (event.key === 'Tab') {
      close(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {trigger({
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': menuId,
        'aria-label': label,
        onClick: () => setOpen((value) => !value),
        ref: triggerRef,
      })}
      {open && (
        <div
          ref={listRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onKeyDown}
          className={`absolute top-full z-50 mt-1.5 min-w-52 rounded-xl border border-line bg-surface p-1 shadow-lg ${
            align === 'end' ? 'right-0' : 'left-0'
          }`}
        >
          {entries.map((entry, index) =>
            entry === 'separator' ? (
              <div key={`separator-${index}`} role="separator" className="my-1 h-px bg-line" />
            ) : (
              <button
                key={entry.label}
                type="button"
                role="menuitem"
                disabled={entry.disabled}
                onClick={() => {
                  close();
                  entry.onSelect();
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-body transition-colors duration-150 disabled:opacity-50 ${
                  entry.danger ? 'text-error hover:bg-red-50 focus:bg-red-50' : 'text-ink hover:bg-surface-2 focus:bg-surface-2'
                } focus:outline-none`}
              >
                {entry.icon && <entry.icon className="h-4 w-4 shrink-0 opacity-80" />}
                {entry.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
