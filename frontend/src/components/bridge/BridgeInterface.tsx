import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Chain {
  id: number;
  name: string;
  icon: string;
}

interface Token {
  symbol: string;
  name: string;
  balance: string;
  icon: string;
}

const SUPPORTED_CHAINS: Chain[] = [
  { id: 1, name: 'Ethereum', icon: '⟠' },
  { id: 137, name: 'Polygon', icon: '⬡' },
  { id: 56, name: 'BSC', icon: '◆' },
  { id: 43114, name: 'Avalanche', icon: '▲' },
  { id: 0, name: 'Stacks', icon: '⬢' },
];

const SUPPORTED_TOKENS: Token[] = [
  { symbol: 'USDC', name: 'USD Coin', balance: '0.00', icon: '💵' },
  { symbol: 'USDT', name: 'Tether USD', balance: '0.00', icon: '💰' },
  { symbol: 'BTC', name: 'Bitcoin', balance: '0.00', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', balance: '0.00', icon: '⟠' },
];

export default function BridgeInterface() {
  const [sourceChain, setSourceChain] = useState<number>(1);
  const [targetChain, setTargetChain] = useState<number>(0);
  const [selectedToken, setSelectedToken] = useState<string>('USDC');
  const [amount, setAmount] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [estimatedFee, setEstimatedFee] = useState<string>('0.30');

  const handleSwapChains = () => {
    const temp = sourceChain;
    setSourceChain(targetChain);
    setTargetChain(temp);
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    // Calculate estimated fee (0.3%)
    if (value && !isNaN(parseFloat(value))) {
      const fee = (parseFloat(value) * 0.003).toFixed(2);
      setEstimatedFee(fee);
    } else {
      setEstimatedFee('0.00');
    }
  };

  const handleBridge = async () => {
    if (!amount || !recipientAddress) return;

    setIsProcessing(true);
    setTxStatus('pending');

    try {
      // Simulate bridge transaction
      await new Promise(resolve => setTimeout(resolve, 3000));

      // In production, call actual bridge contract
      // const result = await lockTokens({
      //   toChain: targetChain,
      //   recipient: recipientAddress,
      //   token: selectedToken,
      //   amount: parseFloat(amount)
      // });

      setTxStatus('success');
      setTimeout(() => {
        setAmount('');
        setRecipientAddress('');
        setTxStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Bridge error:', error);
      setTxStatus('error');
      setTimeout(() => setTxStatus('idle'), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedTokenInfo = SUPPORTED_TOKENS.find(t => t.symbol === selectedToken);
  const sourceChainInfo = SUPPORTED_CHAINS.find(c => c.id === sourceChain);
  const targetChainInfo = SUPPORTED_CHAINS.find(c => c.id === targetChain);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Cross-Chain Bridge</CardTitle>
        <CardDescription>
          Transfer tokens between networks securely with multi-sig validation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chain Selection */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <div className="space-y-2">
            <Label htmlFor="source-chain">From Chain</Label>
            <Select value={sourceChain.toString()} onValueChange={(v) => setSourceChain(parseInt(v))}>
              <SelectTrigger id="source-chain">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CHAINS.filter(c => c.id !== targetChain).map(chain => (
                  <SelectItem key={chain.id} value={chain.id.toString()}>
                    <span className="flex items-center gap-2">
                      <span>{chain.icon}</span>
                      <span>{chain.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center pt-6">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSwapChains}
              className="rounded-full"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-chain">To Chain</Label>
            <Select value={targetChain.toString()} onValueChange={(v) => setTargetChain(parseInt(v))}>
              <SelectTrigger id="target-chain">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CHAINS.filter(c => c.id !== sourceChain).map(chain => (
                  <SelectItem key={chain.id} value={chain.id.toString()}>
                    <span className="flex items-center gap-2">
                      <span>{chain.icon}</span>
                      <span>{chain.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Token Selection */}
        <div className="space-y-2">
          <Label htmlFor="token">Token</Label>
          <Select value={selectedToken} onValueChange={setSelectedToken}>
            <SelectTrigger id="token">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_TOKENS.map(token => (
                <SelectItem key={token.symbol} value={token.symbol}>
                  <span className="flex items-center gap-2">
                    <span>{token.icon}</span>
                    <span>{token.name} ({token.symbol})</span>
                    <span className="ml-auto text-muted-foreground">{token.balance}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="amount">Amount</Label>
            <span className="text-sm text-muted-foreground">
              Balance: {selectedTokenInfo?.balance} {selectedToken}
            </span>
          </div>
          <div className="flex gap-2">
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => handleAmountChange(selectedTokenInfo?.balance || '0')}
            >
              MAX
            </Button>
          </div>
        </div>

        {/* Recipient Address */}
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient Address</Label>
          <Input
            id="recipient"
            placeholder={targetChain === 0 ? 'SP...' : '0x...'}
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
          />
        </div>

        {/* Transaction Summary */}
        {amount && parseFloat(amount) > 0 && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">You will send</span>
              <span className="font-medium">{amount} {selectedToken}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bridge fee (0.3%)</span>
              <span className="font-medium">{estimatedFee} {selectedToken}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Recipient receives</span>
              <span className="font-medium">
                {(parseFloat(amount) - parseFloat(estimatedFee)).toFixed(2)} {selectedToken}
              </span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">Route</span>
              <span className="font-medium">
                {sourceChainInfo?.name} → {targetChainInfo?.name}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Est. time</span>
              <span className="font-medium">~5-10 minutes</span>
            </div>
          </div>
        )}

        {/* Status Alerts */}
        {txStatus === 'pending' && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Processing bridge transaction... Please wait for multi-sig validation.
            </AlertDescription>
          </Alert>
        )}

        {txStatus === 'success' && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Bridge transaction submitted successfully! Track your transaction in the history tab.
            </AlertDescription>
          </Alert>
        )}

        {txStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Bridge transaction failed. Please try again or contact support.
            </AlertDescription>
          </Alert>
        )}

        {/* Bridge Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleBridge}
          disabled={
            !amount ||
            !recipientAddress ||
            parseFloat(amount) <= 0 ||
            sourceChain === targetChain ||
            isProcessing
          }
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>Bridge {selectedToken}</>
          )}
        </Button>

        {/* Info Notice */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>Bridge transactions require 3+ validator signatures for security</p>
          <p>Daily limit per token applies. Current limit: $100,000 USDC equivalent</p>
        </div>
      </CardContent>
    </Card>
  );
}
