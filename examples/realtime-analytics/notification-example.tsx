/**
 * Toast Notification Integration Example
 *
 * This example shows how to integrate toast notifications
 * with WebSocket events for real-time alerts.
 */

import React, { useEffect } from 'react';
import { useWebSocket, WebSocketEvent } from '@/hooks/useWebSocket';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, DollarSign, MousePointerClick, Eye, AlertCircle } from 'lucide-react';

export function NotificationExample() {
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(false);

  const { isConnected, latestEvent } = useWebSocket({
    contractId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.campaigns',
    autoConnect: true,
  });

  // Play notification sound
  const playSound = () => {
    if (soundEnabled) {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(console.error);
    }
  };

  // Handle different event types with custom notifications
  useEffect(() => {
    if (!latestEvent || !notificationsEnabled) return;

    const eventHandlers: Record<string, () => void> = {
      campaign_created: () => {
        toast({
          title: '🎉 New Campaign Created',
          description: `Campaign "${latestEvent.data?.name}" is now live`,
          duration: 5000,
        });
        playSound();
      },

      impression_tracked: () => {
        // Only show every 100th impression to avoid spam
        if (latestEvent.data?.impressionCount % 100 === 0) {
          toast({
            title: (
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>Milestone Reached</span>
              </div>
            ),
            description: `${latestEvent.data?.impressionCount} impressions tracked!`,
            duration: 3000,
          });
        }
      },

      click_tracked: () => {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              <span>Click Registered</span>
            </div>
          ),
          description: 'A user clicked on an ad',
          duration: 2000,
        });
        playSound();
      },

      payment_processed: () => {
        const amount = latestEvent.data?.amount || 0;
        toast({
          title: (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Payment Processed</span>
            </div>
          ),
          description: `$${amount.toFixed(2)} transaction completed`,
          duration: 4000,
        });
        playSound();
      },

      bid_placed: () => {
        const bidAmount = latestEvent.data?.amount || 0;
        const bidder = latestEvent.data?.bidder || 'Unknown';
        toast({
          title: '💰 New Bid Placed',
          description: `${bidder.slice(0, 8)}... bid $${bidAmount.toFixed(2)}`,
          duration: 3000,
        });
        playSound();
      },

      auction_finalized: () => {
        const winner = latestEvent.data?.winner || 'Unknown';
        const winningBid = latestEvent.data?.winningBid || 0;
        toast({
          title: '🏆 Auction Complete',
          description: `Winner: ${winner.slice(0, 8)}... ($${winningBid.toFixed(2)})`,
          duration: 5000,
        });
        playSound();
      },

      campaign_paused: () => {
        toast({
          title: '⏸️ Campaign Paused',
          description: 'A campaign has been paused by its owner',
          variant: 'destructive',
          duration: 4000,
        });
      },

      error: () => {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Error Occurred</span>
            </div>
          ),
          description: latestEvent.data?.message || 'An error occurred',
          variant: 'destructive',
          duration: 6000,
        });
        playSound();
      },

      governance_proposal_created: () => {
        toast({
          title: '🗳️ New Governance Proposal',
          description: `"${latestEvent.data?.title}" - Vote now!`,
          duration: 5000,
        });
        playSound();
      },

      governance_vote_cast: () => {
        toast({
          title: '✅ Vote Recorded',
          description: 'Your vote has been cast on-chain',
          duration: 3000,
        });
      },
    };

    const handler = eventHandlers[latestEvent.type];
    if (handler) {
      handler();
    } else {
      // Generic notification for unknown event types
      toast({
        title: '📡 Blockchain Event',
        description: `New ${latestEvent.type.replace('_', ' ')} event`,
        duration: 2000,
      });
    }
  }, [latestEvent, notificationsEnabled, soundEnabled, toast]);

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    if (notificationsEnabled) {
      requestNotificationPermission();
    }
  }, [notificationsEnabled]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications" className="flex flex-col gap-1">
              <span>Enable Notifications</span>
              <span className="text-sm text-muted-foreground font-normal">
                Show toast notifications for blockchain events
              </span>
            </Label>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="sound" className="flex flex-col gap-1">
              <span>Enable Sound</span>
              <span className="text-sm text-muted-foreground font-normal">
                Play sound for important events
              </span>
            </Label>
            <Switch
              id="sound"
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
            />
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Connection Status: {' '}
              <span className={isConnected ? 'text-green-500' : 'text-red-500'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </p>
            {notificationsEnabled && 'Notification' in window && (
              <p className="text-sm text-muted-foreground mt-2">
                Browser Notifications: {' '}
                <span className={
                  Notification.permission === 'granted'
                    ? 'text-green-500'
                    : 'text-yellow-500'
                }>
                  {Notification.permission}
                </span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-medium min-w-[160px]">Campaign Created:</span>
              <span className="text-muted-foreground">5 second toast with sound</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium min-w-[160px]">Click Tracked:</span>
              <span className="text-muted-foreground">2 second toast with sound</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium min-w-[160px]">Payment Processed:</span>
              <span className="text-muted-foreground">4 second toast with amount</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium min-w-[160px]">Bid Placed:</span>
              <span className="text-muted-foreground">3 second toast with bidder info</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium min-w-[160px]">Auction Finalized:</span>
              <span className="text-muted-foreground">5 second toast with winner</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium min-w-[160px]">Impression Milestone:</span>
              <span className="text-muted-foreground">Shows every 100 impressions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium min-w-[160px]">Error Events:</span>
              <span className="text-muted-foreground">6 second destructive toast</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium min-w-[160px]">Governance Events:</span>
              <span className="text-muted-foreground">Proposal and vote notifications</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
