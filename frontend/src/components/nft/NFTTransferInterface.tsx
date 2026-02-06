'use client';

import { useState } from 'react';
import { Send, AlertCircle, CheckCircle, Loader2, ArrowRight } from 'lucide-react';

interface NFT {
  tokenId: number;
  name: string;
  imageUrl: string;
  owner: string;
}

export function NFTTransferInterface() {
  const [selectedNFT, setSelectedNFT] = useState<number | null>(null);
  const [recipient, setRecipient] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Mock NFTs owned by current user
  const ownedNFTs: NFT[] = [
    {
      tokenId: 1,
      name: 'Summer Campaign Banner',
      imageUrl: 'https://via.placeholder.com/200',
      owner: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
    },
    {
      tokenId: 2,
      name: 'Product Launch Video',
      imageUrl: 'https://via.placeholder.com/200',
      owner: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
    },
    {
      tokenId: 3,
      name: 'Social Media Creative',
      imageUrl: 'https://via.placeholder.com/200',
      owner: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
    },
  ];

  const selectedNFTData = ownedNFTs.find((nft) => nft.tokenId === selectedNFT);

  const validateAddress = (address: string): boolean => {
    // Basic Stacks address validation
    return address.startsWith('SP') || address.startsWith('ST');
  };

  const handleTransfer = async () => {
    if (!selectedNFT || !recipient) return;

    setTransferring(true);
    setTxStatus('pending');
    setErrorMessage('');

    try {
      // TODO: Implement actual contract call
      console.log('Transferring NFT:', {
        tokenId: selectedNFT,
        recipient,
      });

      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock transaction hash
      const mockTxHash = '0x' + Math.random().toString(16).substring(2, 66);
      setTxHash(mockTxHash);
      setTxStatus('success');

      // Reset form after success
      setTimeout(() => {
        setSelectedNFT(null);
        setRecipient('');
        setTxStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Transfer failed:', error);
      setErrorMessage('Transfer failed. Please try again.');
      setTxStatus('error');
    } finally {
      setTransferring(false);
    }
  };

  const isValidRecipient = recipient && validateAddress(recipient);
  const canTransfer = selectedNFT && isValidRecipient && !transferring;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Transfer NFT</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column - NFT Selection */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Select NFT to Transfer</h3>
          <div className="space-y-3">
            {ownedNFTs.map((nft) => (
              <button
                key={nft.tokenId}
                onClick={() => setSelectedNFT(nft.tokenId)}
                disabled={transferring}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedNFT === nft.tokenId
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${transferring ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={nft.imageUrl}
                    alt={nft.name}
                    className="w-16 h-16 rounded object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{nft.name}</p>
                    <p className="text-sm text-gray-600">Token #{nft.tokenId}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column - Transfer Form */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Transfer Details</h3>

          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            {/* Selected NFT Preview */}
            {selectedNFTData && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">Transferring</p>
                <div className="flex items-center gap-3">
                  <img
                    src={selectedNFTData.imageUrl}
                    alt={selectedNFTData.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div>
                    <p className="font-medium">{selectedNFTData.name}</p>
                    <p className="text-sm text-gray-600">Token #{selectedNFTData.tokenId}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recipient Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                disabled={transferring}
                placeholder="SP..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm disabled:bg-gray-50"
              />
              {recipient && !validateAddress(recipient) && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Invalid Stacks address
                </p>
              )}
            </div>

            {/* Transfer Arrow */}
            {selectedNFTData && isValidRecipient && (
              <div className="flex items-center gap-4 py-4 border-y border-gray-200">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">From</p>
                  <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded truncate">
                    {selectedNFTData.owner}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">To</p>
                  <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded truncate">
                    {recipient}
                  </p>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important Notice</p>
                  <p>
                    NFT transfers are permanent and cannot be reversed. Please double-check
                    the recipient address before proceeding.
                  </p>
                </div>
              </div>
            </div>

            {/* Transfer Button */}
            <button
              onClick={handleTransfer}
              disabled={!canTransfer}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {transferring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Transfer NFT
                </>
              )}
            </button>

            {/* Status Messages */}
            {txStatus === 'pending' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <p className="text-sm font-medium">Transaction pending...</p>
                </div>
              </div>
            )}

            {txStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">Transfer successful!</p>
                    <p className="text-xs font-mono break-all">Tx: {txHash}</p>
                  </div>
                </div>
              </div>
            )}

            {txStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">Transfer failed</p>
                    <p>{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
