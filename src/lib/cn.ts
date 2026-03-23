/**
 * Lightweight className utility.
 *
 * Joins truthy string arguments into a single className string.
 * Replaces template-literal concatenation scattered across components
 * with a cleaner, more readable pattern.
 *
 * @example
 * cn('base', isActive && 'active', size === 'lg' && 'text-lg')
 * // → "base active text-lg" (when both conditions are true)
 */
export function cn(
  ...inputs: Array<string | false | null | undefined | 0>
): string {
  return inputs.filter(Boolean).join(' ');
}
