import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, AlertCircle, DollarSign, CreditCard, History } from 'lucide-react';

interface PaymentMethod {
  token: string;
  name: string;
  icon: string;
  balance: string;
  minAmount: string;
  conversionRate: number;
  fee: number;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    token: 'USDC',
    name: 'USD Coin',
    icon: '💵',
    balance: '1,234.56',
    minAmount: '1.00',
    conversionRate: 1.0,
    fee: 2.5,
  },
  {
    token: 'USDT',
    name: 'Tether USD',
    icon: '💰',
    balance: '567.89',
    minAmount: '1.00',
    conversionRate: 1.0,
    fee: 2.5,
  },
  {
    token: 'wUSDC',
    name: 'Wrapped USDC',
    icon: '💵',
    balance: '890.12',
    minAmount: '1.00',
    conversionRate: 1.0,
    fee: 2.5,
  },
  {
    token: 'STX',
    name: 'Stacks',
    icon: '⬢',
    balance: '5,000.00',
    minAmount: '10.00',
    conversionRate: 0.7,
    fee: 2.5,
  },
];

interface PaymentRecord {
  id: string;
  recipient: string;
  token: string;
  amount: string;
  fee: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: number;
}

export default function PaymentDashboard() {
  const [selectedToken, setSelectedToken] = useState<string>('USDC');
  const [amount, setAmount] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [escrowBalance, setEscrowBalance] = useState<Record<string, number>>({
    USDC: 150.00,
    USDT: 75.50,
    wUSDC: 200.00,
    STX: 1000.00,
  });
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([
    {
      id: '1',
      recipient: 'SP2J6ZY...ABC123',
      token: 'USDC',
      amount: '100.00',
      fee: '2.50',
      status: 'completed',
      timestamp: Date.now() - 3600000,
    },
    {
      id: '2',
      recipient: 'SP3K7L9...DEF456',
      token: 'STX',
      amount: '500.00',
      fee: '12.50',
      status: 'completed',
      timestamp: Date.now() - 7200000,
    },
  ]);

  const selectedMethod = PAYMENT_METHODS.find(m => m.token === selectedToken);

  const calculateFee = (value: string) => {
    if (!value || !selectedMethod) return '0.00';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0.00';
    return ((numValue * selectedMethod.fee) / 100).toFixed(2);
  };

  const calculateStxEquivalent = (value: string) => {
    if (!value || !selectedMethod) return '0.00';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0.00';
    return (numValue * selectedMethod.conversionRate).toFixed(2);
  };

  const handlePayment = async () => {
    if (!amount || !recipientAddress || !selectedMethod) return;

    const numAmount = parseFloat(amount);
    const minAmount = parseFloat(selectedMethod.minAmount);

    if (numAmount < minAmount) {
      alert(`Minimum payment amount is ${selectedMethod.minAmount} ${selectedToken}`);
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('pending');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Add to payment history
      const newPayment: PaymentRecord = {
        id: (paymentHistory.length + 1).toString(),
        recipient: recipientAddress.slice(0, 10) + '...' + recipientAddress.slice(-6),
        token: selectedToken,
        amount: amount,
        fee: calculateFee(amount),
        status: 'completed',
        timestamp: Date.now(),
      };

      setPaymentHistory(prev => [newPayment, ...prev]);
      setPaymentStatus('success');

      setTimeout(() => {
        setAmount('');
        setRecipientAddress('');
        setPaymentStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      setTimeout(() => setPaymentStatus('idle'), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDepositToEscrow = async () => {
    if (!amount || !selectedToken) return;

    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setEscrowBalance(prev => ({
        ...prev,
        [selectedToken]: (prev[selectedToken] || 0) + parseFloat(amount),
      }));
      setAmount('');
      alert('Successfully deposited to escrow!');
    } catch (error) {
      alert('Failed to deposit to escrow');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pay" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pay">
            <DollarSign className="h-4 w-4 mr-2" />
            Make Payment
          </TabsTrigger>
          <TabsTrigger value="escrow">
            <CreditCard className="h-4 w-4 mr-2" />
            Escrow
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Make Payment Tab */}
        <TabsContent value="pay">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Token Payment</CardTitle>
              <CardDescription>
                Pay with any whitelisted token. Platform fee: 2.5%
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Method Selection */}
              <div className="space-y-2">
                <Label htmlFor="payment-token">Payment Method</Label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger id="payment-token">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method.token} value={method.token}>
                        <span className="flex items-center gap-2">
                          <span>{method.icon}</span>
                          <span>{method.name} ({method.token})</span>
                          <span className="ml-auto text-muted-foreground">
                            Balance: {method.balance}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="payment-amount">Amount</Label>
                  <span className="text-sm text-muted-foreground">
                    Min: {selectedMethod?.minAmount} {selectedToken}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="payment-amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setAmount(selectedMethod?.balance || '0')}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              {/* Recipient Address */}
              <div className="space-y-2">
                <Label htmlFor="payment-recipient">Recipient Address</Label>
                <Input
                  id="payment-recipient"
                  placeholder="SP..."
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
              </div>

              {/* Payment Summary */}
              {amount && parseFloat(amount) > 0 && selectedMethod && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{amount} {selectedToken}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform fee (2.5%)</span>
                    <span className="font-medium">{calculateFee(amount)} {selectedToken}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Total cost</span>
                    <span className="font-medium">
                      {(parseFloat(amount) + parseFloat(calculateFee(amount))).toFixed(2)}{' '}
                      {selectedToken}
                    </span>
                  </div>
                  {selectedMethod.conversionRate !== 1.0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">STX equivalent</span>
                      <span className="font-medium">{calculateStxEquivalent(amount)} STX</span>
                    </div>
                  )}
                </div>
              )}

              {/* Status Alerts */}
              {paymentStatus === 'pending' && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>Processing payment...</AlertDescription>
                </Alert>
              )}

              {paymentStatus === 'success' && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Payment processed successfully!
                  </AlertDescription>
                </Alert>
              )}

              {paymentStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Payment failed. Please try again.</AlertDescription>
                </Alert>
              )}

              {/* Payment Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handlePayment}
                disabled={
                  !amount ||
                  !recipientAddress ||
                  parseFloat(amount) <= 0 ||
                  isProcessing
                }
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Pay with {selectedToken}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Escrow Tab */}
        <TabsContent value="escrow">
          <Card>
            <CardHeader>
              <CardTitle>Escrow Management</CardTitle>
              <CardDescription>
                Deposit tokens to escrow for faster payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Escrow Balances */}
              <div className="space-y-2">
                <h3 className="font-medium">Your Escrow Balances</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(escrowBalance).map(([token, balance]) => (
                    <div key={token} className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">{token}</div>
                      <div className="text-xl font-bold">{balance.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deposit Form */}
              <div className="space-y-4">
                <h3 className="font-medium">Deposit to Escrow</h3>
                <div className="space-y-2">
                  <Label htmlFor="escrow-token">Token</Label>
                  <Select value={selectedToken} onValueChange={setSelectedToken}>
                    <SelectTrigger id="escrow-token">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(method => (
                        <SelectItem key={method.token} value={method.token}>
                          {method.icon} {method.token}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="escrow-amount">Amount</Label>
                  <Input
                    id="escrow-amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleDepositToEscrow}
                  disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Depositing...
                    </>
                  ) : (
                    <>Deposit to Escrow</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>View your recent payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentHistory.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No payment history yet
                  </div>
                ) : (
                  paymentHistory.map((payment) => (
                    <div
                      key={payment.id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">To: {payment.recipient}</span>
                            <Badge variant="outline">{payment.token}</Badge>
                            <Badge
                              variant={
                                payment.status === 'completed'
                                  ? 'default'
                                  : payment.status === 'pending'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {payment.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {formatTimestamp(payment.timestamp)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{payment.amount} {payment.token}</div>
                          <div className="text-sm text-muted-foreground">
                            Fee: {payment.fee} {payment.token}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
