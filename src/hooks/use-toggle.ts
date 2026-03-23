'use client';

import { useState, useCallback } from 'react';

/**
 * Simple boolean toggle hook.
 *
 * Returns [value, toggle, setValue] where toggle() flips the boolean
 * and setValue allows explicit true/false.
 *
 * @example
 * const [isOpen, toggleOpen, setOpen] = useToggle(false);
 * <button onClick={toggleOpen}>Toggle</button>
 * <button onClick={() => setOpen(true)}>Open</button>
 */
export function useToggle(
  initialValue = false,
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue((prev) => !prev), []);
  return [value, toggle, setValue];
}
