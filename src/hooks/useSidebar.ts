'use client';

import { useRef, useState, useCallback } from 'react';

export function useSidebar() {
  const [open, setOpenRaw] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const setOpen = useCallback((value: boolean) => {
    setOpenRaw(value);
    // Return focus to the hamburger trigger when the sheet closes (AC:2 accessibility)
    if (!value) {
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, []);

  return { open, setOpen, triggerRef };
}
