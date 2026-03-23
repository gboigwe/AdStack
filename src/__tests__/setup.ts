import { afterEach } from 'vitest';

// Clean up after each test
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// Mock matchMedia for components that read media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
