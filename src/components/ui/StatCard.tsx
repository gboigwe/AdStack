import { type LucideIcon, RefreshCw } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  isLoading?: boolean;
  subtitle?: string;
}

/**
 * Reusable stat card used in advertiser and publisher dashboards.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
  isLoading = false,
  subtitle,
}: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
            ) : (
              value
            )}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}
