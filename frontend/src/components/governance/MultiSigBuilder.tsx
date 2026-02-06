'use client';

import { useState } from 'react';
import { Users, Send, AlertCircle, Plus } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';

interface TransactionFormData {
  recipient: string;
  amount: string;
  memo: string;
}

export function MultiSigBuilder() {
  const { address, isConnected } = useWalletStore();
  const [formData, setFormData] = useState<TransactionFormData>({
    recipient: '',
    amount: '',
    memo: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (field: keyof TransactionFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.recipient.trim()) {
      setError('Recipient address is required');
      return false;
    }

    if (!formData.recipient.startsWith('ST') && !formData.recipient.startsWith('SP')) {
      setError('Invalid Stacks address format');
      return false;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }

    if (!formData.memo.trim()) {
      setError('Transaction memo is required');
      return false;
    }

    if (formData.memo.length > 256) {
      setError('Memo must be 256 characters or less');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Convert STX to microSTX
      const amountInMicroSTX = Math.floor(parseFloat(formData.amount) * 1000000);

      // TODO: Call multisig-treasury contract to propose transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSuccess('Transaction proposed successfully! Awaiting signatures.');
      setFormData({
        recipient: '',
        amount: '',
        memo: '',
      });

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to propose transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Wallet</h2>
          <p className="text-gray-600">Connect your wallet to propose transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Multi-Sig Transaction Builder</h1>
        <p className="text-gray-600">Propose a new treasury transaction for multi-signature approval</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-6">
          {/* Recipient Address */}
          <div>
            <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Address *
            </label>
            <input
              type="text"
              id="recipient"
              value={formData.recipient}
              onChange={(e) => handleInputChange('recipient', e.target.value)}
              placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="mt-2 text-xs text-gray-500">
              Enter the Stacks address that will receive the funds
            </p>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount (STX) *
            </label>
            <div className="relative">
              <input
                type="number"
                id="amount"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="0.00"
                step="0.000001"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <span className="text-gray-500 text-sm font-medium">STX</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Transaction amount in STX tokens
            </p>
          </div>

          {/* Memo */}
          <div>
            <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Memo *
            </label>
            <textarea
              id="memo"
              value={formData.memo}
              onChange={(e) => handleInputChange('memo', e.target.value)}
              placeholder="Describe the purpose of this transaction"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={256}
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.memo.length}/256 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Proposing Transaction...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Propose Transaction
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Multi-Signature Process</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Your transaction will be automatically signed upon proposal</li>
          <li>• Requires 3 out of 5 signers to approve the transaction</li>
          <li>• Other signers must review and sign the transaction</li>
          <li>• Once threshold is met, anyone can execute the transaction</li>
          <li>• Transactions can be cancelled by proposer or admin before execution</li>
        </ul>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Required Signatures</p>
          <p className="text-2xl font-bold text-gray-900">3 of 5</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Your Role</p>
          <p className="text-lg font-semibold text-gray-900">Signer</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Treasury Balance</p>
          <p className="text-2xl font-bold text-gray-900">500K STX</p>
        </div>
      </div>
    </div>
  );
}
