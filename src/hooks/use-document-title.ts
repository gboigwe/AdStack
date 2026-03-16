import { useEffect, useRef } from 'react';

/**
 * Set the document title and restore the previous title on unmount.
 *
 * Useful for pages that need a dynamic `<title>` without relying on
 * the Next.js metadata API (e.g. client-rendered campaign detail pages
 * where the title depends on fetched data).
 *
 * @param title - The title to set. Pass `undefined` or an empty string to skip.
 * @param options.restoreOnUnmount - Restore the previous title when the component unmounts (default: true).
 */
export function useDocumentTitle(
  title: string | undefined,
  options: { restoreOnUnmount?: boolean } = {},
) {
  const { restoreOnUnmount = true } = options;
  const previousTitle = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!title) return;

    // Capture the current title the first time we set a new one
    if (previousTitle.current === undefined) {
      previousTitle.current = document.title;
    }

    document.title = title;
  }, [title]);

  useEffect(() => {
    return () => {
      if (restoreOnUnmount && previousTitle.current !== undefined) {
        document.title = previousTitle.current;
      }
    };
    // Only run cleanup on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
