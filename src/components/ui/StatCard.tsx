import { type ReactNode, memo } from 'react';
import { type LucideIcon } from 'lucide-react';
import { Skeleton } from './Skeleton';

interface StatCardBaseProps {
  label: string;
  value?: string | number;
  isLoading?: boolean;
  subtitle?: string;
  className?: string;
}

interface StatCardWithIconComponent extends StatCardBaseProps {
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
}

interface StatCardWithIconElement extends StatCardBaseProps {
  icon: ReactNode;
}

type StatCardProps = StatCardWithIconComponent | StatCardWithIconElement;

function isIconComponent(
  props: StatCardProps,
): props is StatCardWithIconComponent {
  return typeof props.icon === 'function';
}

/**
 * Reusable stat card used in advertiser and publisher dashboards.
 * Accepts either a LucideIcon component or a pre-rendered ReactNode
 * as the icon prop, making it flexible for both usage patterns.
 */
export const StatCard = memo(function StatCard(props: StatCardProps) {
  const { label, value, isLoading = false, subtitle, className = '' } = props;

  const iconElement = isIconComponent(props) ? (
    <div
      className={`w-12 h-12 ${props.iconBgColor || 'bg-blue-100 dark:bg-blue-900/30'} rounded-lg flex items-center justify-center`}
    >
      <props.icon className={`w-6 h-6 ${props.iconColor || 'text-blue-600 dark:text-blue-400'}`} />
    </div>
  ) : (
    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
      {props.icon}
    </div>
  );

  return (
    <div className={`bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              value ?? '—'
            )}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {iconElement}
      </div>
    </div>
  );
});
