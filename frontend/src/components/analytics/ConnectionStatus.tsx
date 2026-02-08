import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting?: boolean;
  showText?: boolean;
}

export default function ConnectionStatus({
  isConnected,
  isConnecting = false,
  showText = true,
}: ConnectionStatusProps) {
  if (isConnecting) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        {showText && <span>Connecting...</span>}
      </Badge>
    );
  }

  if (isConnected) {
    return (
      <Badge variant="default" className="gap-1 bg-green-500">
        <Wifi className="h-3 w-3" />
        {showText && <span>Live</span>}
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="gap-1">
      <WifiOff className="h-3 w-3" />
      {showText && <span>Disconnected</span>}
    </Badge>
  );
}
