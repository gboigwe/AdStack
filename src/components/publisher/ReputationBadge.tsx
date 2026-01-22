import React from 'react';

interface ReputationBadgeProps {
  score: number;
  tier: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

const tierConfig = [
  { name: 'Novice', color: 'bg-gray-100 text-gray-700', icon: '🌱', minScore: 0 },
  { name: 'Bronze', color: 'bg-orange-100 text-orange-700', icon: '🥉', minScore: 100 },
  { name: 'Silver', color: 'bg-gray-200 text-gray-800', icon: '🥈', minScore: 250 },
  { name: 'Gold', color: 'bg-yellow-100 text-yellow-700', icon: '🥇', minScore: 500 },
  { name: 'Platinum', color: 'bg-purple-100 text-purple-700', icon: '💎', minScore: 1000 }
];

export const ReputationBadge: React.FC<ReputationBadgeProps> = ({
  score,
  tier,
  size = 'md',
  showDetails = false
}) => {
  const config = tierConfig[tier] || tierConfig[0];
  const nextTier = tierConfig[tier + 1];

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  const calculateProgress = () => {
    if (!nextTier) return 100;
    const currentMin = config.minScore;
    const nextMin = nextTier.minScore;
    const progress = ((score - currentMin) / (nextMin - currentMin)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  if (showDetails) {
    return (
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <div className="font-bold text-lg">{config.name}</div>
              <div className="text-sm text-gray-600">Reputation Tier</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{score}</div>
            <div className="text-xs text-gray-500">Score</div>
          </div>
        </div>

        {nextTier && (
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress to {nextTier.name}</span>
              <span>{score} / {nextTier.minScore}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${config.color.split(' ')[0]}`}
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
        )}

        {!nextTier && (
          <div className="text-center py-2">
            <span className="text-sm font-semibold text-purple-600">
              ⭐ Maximum Tier Achieved! ⭐
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-2 rounded-full ${config.color} ${sizeClasses[size]} font-semibold`}>
      <span className={iconSizes[size]}>{config.icon}</span>
      <span>{config.name}</span>
      {size !== 'sm' && <span className="opacity-70">•</span>}
      {size !== 'sm' && <span>{score}</span>}
    </div>
  );
};

export default ReputationBadge;
