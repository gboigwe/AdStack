import { cn } from '@/lib/cn';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  /** Stacks address or display name — first 2 chars used as initials */
  name: string;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
};

/**
 * Deterministic color palette for avatar backgrounds.
 * Chosen for readability on both light and dark themes.
 */
const COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-rose-500',
] as const;

/** Simple hash of a string to pick a consistent color index. */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Generate initials from a name or address.
 * Addresses (SP..., ST...) show first 2 chars: "SP".
 * Names show first letter of first two words: "JD".
 */
function getInitials(name: string): string {
  if (!name) return '?';
  // Stacks address — use first two chars
  if (/^(SP|ST)/i.test(name)) return name.slice(0, 2).toUpperCase();
  // Split name into words
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Circular avatar with deterministic color based on name/address.
 *
 * Renders initials derived from the name. Uses a simple hash to
 * consistently assign a background color so the same address always
 * gets the same color.
 */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name);
  const colorIndex = hashString(name) % COLORS.length;
  const bgColor = COLORS[colorIndex];

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white select-none',
        SIZE_CLASSES[size],
        bgColor,
        className,
      )}
      aria-hidden="true"
      title={name}
    >
      {initials}
    </div>
  );
}
