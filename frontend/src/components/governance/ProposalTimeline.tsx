'use client';

import { Clock, CheckCircle2, XCircle, Play, Pause } from 'lucide-react';

interface TimelineEvent {
  id: number;
  title: string;
  description: string;
  timestamp: number;
  blockHeight: number;
  type: 'created' | 'active' | 'succeeded' | 'defeated' | 'executed' | 'cancelled';
}

interface ProposalTimelineProps {
  proposalId: number;
  currentState: number;
  startBlock: number;
  endBlock: number;
  executionDelayEnd?: number;
  events?: TimelineEvent[];
}

export function ProposalTimeline({
  proposalId,
  currentState,
  startBlock,
  endBlock,
  executionDelayEnd,
  events = [],
}: ProposalTimelineProps) {
  const getStateInfo = (state: number) => {
    switch (state) {
      case 0:
        return {
          label: 'Pending',
          icon: Pause,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          iconColor: 'text-yellow-600',
        };
      case 1:
        return {
          label: 'Active',
          icon: Play,
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          iconColor: 'text-blue-600',
        };
      case 2:
        return {
          label: 'Succeeded',
          icon: CheckCircle2,
          color: 'bg-green-100 text-green-800 border-green-300',
          iconColor: 'text-green-600',
        };
      case 3:
        return {
          label: 'Defeated',
          icon: XCircle,
          color: 'bg-red-100 text-red-800 border-red-300',
          iconColor: 'text-red-600',
        };
      case 4:
        return {
          label: 'Executed',
          icon: CheckCircle2,
          color: 'bg-purple-100 text-purple-800 border-purple-300',
          iconColor: 'text-purple-600',
        };
      case 5:
        return {
          label: 'Cancelled',
          icon: XCircle,
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          iconColor: 'text-gray-600',
        };
      default:
        return {
          label: 'Unknown',
          icon: Clock,
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          iconColor: 'text-gray-600',
        };
    }
  };

  const stateInfo = getStateInfo(currentState);
  const StateIcon = stateInfo.icon;

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'created':
        return Clock;
      case 'active':
        return Play;
      case 'succeeded':
        return CheckCircle2;
      case 'defeated':
        return XCircle;
      case 'executed':
        return CheckCircle2;
      case 'cancelled':
        return XCircle;
      default:
        return Clock;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'created':
        return 'bg-gray-500';
      case 'active':
        return 'bg-blue-500';
      case 'succeeded':
        return 'bg-green-500';
      case 'defeated':
        return 'bg-red-500';
      case 'executed':
        return 'bg-purple-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Proposal Timeline</h3>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 ${stateInfo.color}`}>
          <StateIcon className={`w-4 h-4 ${stateInfo.iconColor}`} />
          <span className="text-sm font-medium">{stateInfo.label}</span>
        </div>
      </div>

      {/* Block Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Voting Progress</span>
          <span className="font-medium">
            Block {startBlock} - {endBlock}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{
              width: currentState >= 1 ? '100%' : '0%',
            }}
          />
        </div>
      </div>

      {/* Timeline Events */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No timeline events yet</p>
          </div>
        ) : (
          events.map((event, index) => {
            const EventIcon = getEventIcon(event.type);
            const eventColor = getEventColor(event.type);
            const isLast = index === events.length - 1;

            return (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${eventColor}`}>
                    <EventIcon className="w-5 h-5 text-white" />
                  </div>
                  {!isLast && (
                    <div className="w-0.5 h-full bg-gray-200 mt-2" />
                  )}
                </div>

                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm font-semibold text-gray-900">{event.title}</h4>
                    <span className="text-xs text-gray-500">Block {event.blockHeight}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Execution Delay Info */}
      {executionDelayEnd && currentState === 2 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900 mb-1">
                Execution Delay Period
              </p>
              <p className="text-sm text-yellow-800">
                This proposal can be executed after block {executionDelayEnd}. This delay provides
                time for the community to review the passed proposal before execution.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
