'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Minus, Check } from 'lucide-react';

interface VotingInterfaceProps {
  proposalId: number;
  proposalTitle: string;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  userVoted?: boolean;
  userVote?: number; // 0=against, 1=for, 2=abstain
  onVoteSubmit?: (proposalId: number, support: number) => Promise<void>;
}

export function VotingInterface({
  proposalId,
  proposalTitle,
  forVotes,
  againstVotes,
  abstainVotes,
  userVoted = false,
  userVote,
  onVoteSubmit,
}: VotingInterfaceProps) {
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const totalVotes = forVotes + againstVotes + abstainVotes;
  const forPercentage = totalVotes > 0 ? (forVotes / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (againstVotes / totalVotes) * 100 : 0;
  const abstainPercentage = totalVotes > 0 ? (abstainVotes / totalVotes) * 100 : 0;

  const handleVoteSubmit = async () => {
    if (selectedVote === null) {
      setError('Please select a vote option');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (onVoteSubmit) {
        await onVoteSubmit(proposalId, selectedVote);
      } else {
        // TODO: Call governance-core contract to cast vote
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVoteLabel = (vote: number): string => {
    switch (vote) {
      case 0: return 'Against';
      case 1: return 'For';
      case 2: return 'Abstain';
      default: return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Cast Your Vote</h3>

      {/* Vote Results Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Current Results</span>
          <span className="font-medium">
            {totalVotes.toLocaleString()} total vote{totalVotes !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden flex">
          <div
            className="bg-green-500 transition-all duration-300"
            style={{ width: `${forPercentage}%` }}
            title={`For: ${forPercentage.toFixed(1)}%`}
          />
          <div
            className="bg-red-500 transition-all duration-300"
            style={{ width: `${againstPercentage}%` }}
            title={`Against: ${againstPercentage.toFixed(1)}%`}
          />
          <div
            className="bg-gray-400 transition-all duration-300"
            style={{ width: `${abstainPercentage}%` }}
            title={`Abstain: ${abstainPercentage.toFixed(1)}%`}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mt-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
              <ThumbsUp className="w-4 h-4" />
              <span className="text-xs font-medium">For</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {forPercentage.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {(forVotes / 1000000).toFixed(2)}K votes
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
              <ThumbsDown className="w-4 h-4" />
              <span className="text-xs font-medium">Against</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {againstPercentage.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {(againstVotes / 1000000).toFixed(2)}K votes
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
              <Minus className="w-4 h-4" />
              <span className="text-xs font-medium">Abstain</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {abstainPercentage.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {(abstainVotes / 1000000).toFixed(2)}K votes
            </p>
          </div>
        </div>
      </div>

      {/* Voting Options */}
      {userVoted ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">You voted</p>
              <p className="text-sm text-blue-700">
                Your vote: <span className="font-semibold">{getVoteLabel(userVote || 0)}</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            <button
              onClick={() => setSelectedVote(1)}
              className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                selectedVote === 1
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedVote === 1 ? 'border-green-500 bg-green-500' : 'border-gray-300'
              }`}>
                {selectedVote === 1 && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <ThumbsUp className={`w-5 h-5 ${selectedVote === 1 ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={`font-medium ${selectedVote === 1 ? 'text-green-900' : 'text-gray-700'}`}>
                Vote For
              </span>
            </button>

            <button
              onClick={() => setSelectedVote(0)}
              className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                selectedVote === 0
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedVote === 0 ? 'border-red-500 bg-red-500' : 'border-gray-300'
              }`}>
                {selectedVote === 0 && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <ThumbsDown className={`w-5 h-5 ${selectedVote === 0 ? 'text-red-600' : 'text-gray-400'}`} />
              <span className={`font-medium ${selectedVote === 0 ? 'text-red-900' : 'text-gray-700'}`}>
                Vote Against
              </span>
            </button>

            <button
              onClick={() => setSelectedVote(2)}
              className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                selectedVote === 2
                  ? 'border-gray-500 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedVote === 2 ? 'border-gray-500 bg-gray-500' : 'border-gray-300'
              }`}>
                {selectedVote === 2 && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <Minus className={`w-5 h-5 ${selectedVote === 2 ? 'text-gray-600' : 'text-gray-400'}`} />
              <span className={`font-medium ${selectedVote === 2 ? 'text-gray-900' : 'text-gray-700'}`}>
                Abstain
              </span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            onClick={handleVoteSubmit}
            disabled={isSubmitting || selectedVote === null}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Submitting Vote...
              </span>
            ) : (
              'Submit Vote'
            )}
          </button>
        </>
      )}
    </div>
  );
}
