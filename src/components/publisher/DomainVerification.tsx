import React, { useState, useEffect } from 'react';
import { useConnect } from '@stacks/connect-react';
import { stringAsciiCV, uintCV } from '@stacks/transactions';

interface VerificationMethod {
  id: string;
  name: string;
  description: string;
  instructions: string;
}

interface DomainVerificationProps {
  publisherId: number;
  domain: string;
  onVerified?: () => void;
}

export const DomainVerification: React.FC<DomainVerificationProps> = ({
  publisherId,
  domain,
  onVerified
}) => {
  const { doContractCall } = useConnect();
  const [selectedMethod, setSelectedMethod] = useState<string>('dns');
  const [challengeCode, setChallengeCode] = useState<string>('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verificationMethods: VerificationMethod[] = [
    {
      id: 'dns',
      name: 'DNS TXT Record',
      description: 'Add a TXT record to your DNS settings',
      instructions: 'Recommended for domain-level verification'
    },
    {
      id: 'meta',
      name: 'HTML Meta Tag',
      description: 'Add a meta tag to your homepage',
      instructions: 'Quick setup, verify instantly'
    },
    {
      id: 'file',
      name: 'Verification File',
      description: 'Upload a file to your web root',
      instructions: 'Best for static sites'
    }
  ];

  useEffect(() => {
    // Generate challenge code on mount
    const code = `verify-${publisherId}-${Date.now()}`;
    setChallengeCode(code);
  }, [publisherId]);

  const handleCreateChallenge = async () => {
    setError(null);

    try {
      await doContractCall({
        contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        contractName: 'publisher-verification',
        functionName: 'create-domain-challenge',
        functionArgs: [
          uintCV(publisherId),
          stringAsciiCV(selectedMethod)
        ],
        onFinish: (data) => {
          console.log('Challenge created:', data);
        },
        onCancel: () => {
          setError('Transaction cancelled');
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create challenge');
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);

    try {
      // In production, this would call a backend service to check verification
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock verification success
      setVerified(true);
      onVerified?.();
    } catch (err) {
      setError('Verification failed. Please ensure the record is correctly configured.');
    } finally {
      setVerifying(false);
    }
  };

  const renderMethodInstructions = () => {
    switch (selectedMethod) {
      case 'dns':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Step 1: Add DNS Record</h4>
              <p className="text-sm text-gray-600 mb-3">
                Log in to your DNS provider and add the following TXT record:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Type:</span>
                    <code className="ml-2 bg-white px-2 py-1 rounded">TXT</code>
                  </div>
                  <div>
                    <span className="font-medium">Name:</span>
                    <code className="ml-2 bg-white px-2 py-1 rounded">@</code>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Value:</span>
                    <code className="ml-2 bg-white px-2 py-1 rounded break-all">
                      adstack-verify={challengeCode}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(`adstack-verify=${challengeCode}`)}
                      className="ml-2 text-xs text-blue-600 hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Step 2: Wait for Propagation</h4>
              <p className="text-sm text-gray-600">
                DNS changes can take up to 48 hours to propagate globally. You can check the status using:
              </p>
              <code className="block mt-2 bg-gray-100 p-2 rounded text-sm">
                dig {domain} TXT
              </code>
            </div>
          </div>
        );

      case 'meta':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Step 1: Add Meta Tag</h4>
              <p className="text-sm text-gray-600 mb-3">
                Add this meta tag to the {`<head>`} section of your homepage:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <code className="text-sm break-all">
                  {`<meta name="adstack-verification" content="${challengeCode}" />`}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(`<meta name="adstack-verification" content="${challengeCode}" />`)}
                  className="ml-2 text-xs text-blue-600 hover:underline"
                >
                  Copy
                </button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Step 2: Verify Installation</h4>
              <p className="text-sm text-gray-600">
                Visit your homepage and check the page source to ensure the tag is present.
              </p>
            </div>
          </div>
        );

      case 'file':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Step 1: Create Verification File</h4>
              <p className="text-sm text-gray-600 mb-3">
                Create a file named <code className="bg-gray-100 px-2 py-1 rounded">adstack-verify.txt</code> with the following content:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <code className="text-sm">{challengeCode}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(challengeCode)}
                  className="ml-2 text-xs text-blue-600 hover:underline"
                >
                  Copy
                </button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Step 2: Upload to Web Root</h4>
              <p className="text-sm text-gray-600 mb-2">
                Upload the file to your web server's root directory. It should be accessible at:
              </p>
              <a
                href={`https://${domain}/adstack-verify.txt`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                https://{domain}/adstack-verify.txt
              </a>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (verified) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h3 className="text-xl font-bold text-green-800 mb-2">
          Domain Verified Successfully!
        </h3>
        <p className="text-gray-600">
          {domain} has been verified and linked to your publisher account.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-2">Verify Domain Ownership</h2>
      <p className="text-gray-600 mb-6">
        Verify that you own <strong>{domain}</strong> to complete your publisher registration.
      </p>

      {/* Method Selection */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Choose Verification Method</h3>
        <div className="grid grid-cols-3 gap-4">
          {verificationMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                selectedMethod === method.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className="font-semibold mb-1">{method.name}</h4>
              <p className="text-xs text-gray-600 mb-2">{method.description}</p>
              <p className="text-xs text-gray-500 italic">{method.instructions}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="font-semibold mb-4 flex items-center">
          <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
            {verificationMethods.findIndex(m => m.id === selectedMethod) + 1}
          </span>
          Setup Instructions
        </h3>
        {renderMethodInstructions()}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-between">
        <button
          onClick={handleCreateChallenge}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          Regenerate Code
        </button>
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
        >
          {verifying ? 'Verifying...' : 'Verify Domain'}
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-sm mb-2">Need Help?</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• DNS changes can take up to 48 hours to propagate</li>
          <li>• Make sure there are no typos in the verification code</li>
          <li>• For meta tag method, the tag must be in the {`<head>`} section</li>
          <li>• For file method, ensure the file is publicly accessible</li>
        </ul>
      </div>
    </div>
  );
};

export default DomainVerification;
