/**
 * AdStack Governance Integration Examples
 *
 * This file demonstrates how to integrate the AdStack governance system
 * into your application with practical code examples.
 */

import {
  createProposal,
  castVote,
  getProposal,
  delegateVotingPower,
  revokeDelegation,
  getVotingPower,
  proposeTreasuryTransaction,
  signTreasuryTransaction,
  executeTreasuryTransaction,
  PROPOSAL_STATES,
  VOTE_SUPPORT,
} from '../frontend/src/lib/governance/contracts';

// Contract addresses (update with actual deployed addresses)
const GOVERNANCE_CORE_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.governance-core';
const GOVERNANCE_TOKEN_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.governance-token';
const MULTISIG_TREASURY_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.multisig-treasury';

/**
 * Example 1: Create a Simple Governance Proposal
 */
async function example1_CreateSimpleProposal() {
  console.log('Example 1: Creating a simple governance proposal');

  try {
    const result = await createProposal(
      GOVERNANCE_CORE_ADDRESS,
      'Increase Marketing Budget',
      'Proposal to allocate an additional 50,000 STX to the marketing budget for Q2 2024. This will fund community outreach, content creation, and partnership development.',
      undefined, // No contract call
      undefined,
      undefined
    );

    console.log('Proposal created successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to create proposal:', error);
    throw error;
  }
}

/**
 * Example 2: Create a Proposal with Contract Execution
 */
async function example2_CreateProposalWithExecution() {
  console.log('Example 2: Creating proposal with contract execution');

  const targetContract = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.governance-core';
  const functionName = 'set-quorum-percentage';
  const newQuorum = 50; // 50%

  try {
    const result = await createProposal(
      GOVERNANCE_CORE_ADDRESS,
      'Increase Quorum Requirement',
      'Proposal to increase the quorum requirement from 40% to 50% to ensure broader community participation in governance decisions.',
      targetContract,
      functionName,
      newQuorum
    );

    console.log('Proposal with execution created:', result);
    return result;
  } catch (error) {
    console.error('Failed to create proposal with execution:', error);
    throw error;
  }
}

/**
 * Example 3: Vote on a Proposal
 */
async function example3_VoteOnProposal(proposalId: number) {
  console.log(`Example 3: Voting FOR proposal #${proposalId}`);

  try {
    // Vote FOR the proposal
    const result = await castVote(
      GOVERNANCE_CORE_ADDRESS,
      proposalId,
      VOTE_SUPPORT.FOR
    );

    console.log('Vote cast successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to cast vote:', error);
    throw error;
  }
}

/**
 * Example 4: Check Proposal Status
 */
async function example4_CheckProposalStatus(proposalId: number) {
  console.log(`Example 4: Checking status of proposal #${proposalId}`);

  try {
    const proposal = await getProposal(GOVERNANCE_CORE_ADDRESS, proposalId);

    if (!proposal) {
      console.log('Proposal not found');
      return;
    }

    console.log('Proposal details:', {
      id: proposal.proposalId,
      title: proposal.title,
      state: getStateName(proposal.state),
      forVotes: proposal.forVotes,
      againstVotes: proposal.againstVotes,
      abstainVotes: proposal.abstainVotes,
      totalVotes: proposal.forVotes + proposal.againstVotes + proposal.abstainVotes,
    });

    return proposal;
  } catch (error) {
    console.error('Failed to get proposal:', error);
    throw error;
  }
}

/**
 * Example 5: Delegate Voting Power
 */
async function example5_DelegateVotingPower(delegateAddress: string) {
  console.log(`Example 5: Delegating voting power to ${delegateAddress}`);

  try {
    const result = await delegateVotingPower(
      GOVERNANCE_TOKEN_ADDRESS,
      delegateAddress
    );

    console.log('Voting power delegated successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to delegate voting power:', error);
    throw error;
  }
}

/**
 * Example 6: Revoke Delegation
 */
async function example6_RevokeDelegation() {
  console.log('Example 6: Revoking voting power delegation');

  try {
    const result = await revokeDelegation(GOVERNANCE_TOKEN_ADDRESS);

    console.log('Delegation revoked successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to revoke delegation:', error);
    throw error;
  }
}

/**
 * Example 7: Check Voting Power
 */
async function example7_CheckVotingPower(address: string) {
  console.log(`Example 7: Checking voting power for ${address}`);

  try {
    const votingPower = await getVotingPower(GOVERNANCE_TOKEN_ADDRESS, address);

    console.log(`Voting power: ${votingPower} ADSGOV tokens`);
    return votingPower;
  } catch (error) {
    console.error('Failed to get voting power:', error);
    throw error;
  }
}

/**
 * Example 8: Propose Treasury Transaction
 */
async function example8_ProposeTreasuryTransaction() {
  console.log('Example 8: Proposing a treasury transaction');

  const recipient = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
  const amount = 50000000000; // 50,000 STX in microSTX
  const memo = 'Q2 2024 Marketing Budget Allocation';

  try {
    const result = await proposeTreasuryTransaction(
      MULTISIG_TREASURY_ADDRESS,
      recipient,
      amount,
      memo
    );

    console.log('Treasury transaction proposed:', result);
    return result;
  } catch (error) {
    console.error('Failed to propose treasury transaction:', error);
    throw error;
  }
}

/**
 * Example 9: Sign Treasury Transaction
 */
async function example9_SignTreasuryTransaction(txId: number) {
  console.log(`Example 9: Signing treasury transaction #${txId}`);

  try {
    const result = await signTreasuryTransaction(
      MULTISIG_TREASURY_ADDRESS,
      txId
    );

    console.log('Transaction signed successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to sign transaction:', error);
    throw error;
  }
}

/**
 * Example 10: Execute Treasury Transaction
 */
async function example10_ExecuteTreasuryTransaction(txId: number) {
  console.log(`Example 10: Executing treasury transaction #${txId}`);

  try {
    const result = await executeTreasuryTransaction(
      MULTISIG_TREASURY_ADDRESS,
      txId
    );

    console.log('Transaction executed successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to execute transaction:', error);
    throw error;
  }
}

/**
 * Example 11: Complete Proposal Lifecycle
 */
async function example11_CompleteProposalLifecycle() {
  console.log('Example 11: Complete proposal lifecycle');

  try {
    // Step 1: Create proposal
    console.log('Step 1: Creating proposal...');
    const createResult = await createProposal(
      GOVERNANCE_CORE_ADDRESS,
      'Test Proposal',
      'This is a test proposal to demonstrate the complete lifecycle',
      undefined,
      undefined,
      undefined
    );
    const proposalId = 1; // Assume this is the returned proposal ID

    // Step 2: Wait for voting period to start
    console.log('Step 2: Voting period active...');

    // Step 3: Cast votes
    console.log('Step 3: Casting votes...');
    await castVote(GOVERNANCE_CORE_ADDRESS, proposalId, VOTE_SUPPORT.FOR);

    // Step 4: Check if passed
    console.log('Step 4: Checking if proposal passed...');
    const proposal = await getProposal(GOVERNANCE_CORE_ADDRESS, proposalId);

    if (proposal && proposal.state === PROPOSAL_STATES.SUCCEEDED) {
      console.log('Proposal succeeded! Execution delay period started.');
    }

    // Step 5: Execute after delay
    console.log('Step 5: Ready for execution after delay period...');

    console.log('Complete lifecycle example finished');
  } catch (error) {
    console.error('Lifecycle example failed:', error);
    throw error;
  }
}

/**
 * Example 12: Multi-Sig Treasury Workflow
 */
async function example12_MultiSigTreasuryWorkflow() {
  console.log('Example 12: Multi-sig treasury workflow');

  try {
    // Step 1: Propose transaction
    console.log('Step 1: Proposing transaction...');
    const proposeResult = await proposeTreasuryTransaction(
      MULTISIG_TREASURY_ADDRESS,
      'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
      10000000000, // 10,000 STX
      'Development team payment'
    );
    const txId = 1; // Assume this is the returned tx ID

    // Step 2: Additional signers sign (2 more needed)
    console.log('Step 2: Collecting signatures...');
    // In real scenario, other signers would call signTreasuryTransaction

    // Step 3: Execute when threshold met
    console.log('Step 3: Executing transaction...');
    await executeTreasuryTransaction(MULTISIG_TREASURY_ADDRESS, txId);

    console.log('Multi-sig workflow completed successfully');
  } catch (error) {
    console.error('Multi-sig workflow failed:', error);
    throw error;
  }
}

/**
 * Helper function to get human-readable state name
 */
function getStateName(state: number): string {
  const stateNames = ['PENDING', 'ACTIVE', 'SUCCEEDED', 'DEFEATED', 'EXECUTED', 'CANCELLED'];
  return stateNames[state] || 'UNKNOWN';
}

/**
 * Example 13: React Component Integration
 */
const ReactIntegrationExample = `
import { useState } from 'react';
import { GovernanceDashboard } from '@/components/governance/GovernanceDashboard';
import { ProposalWizard } from '@/components/governance/ProposalWizard';
import { VotingInterface } from '@/components/governance/VotingInterface';

export function GovernancePage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div>
      <nav>
        <button onClick={() => setActiveTab('dashboard')}>Dashboard</button>
        <button onClick={() => setActiveTab('create')}>Create Proposal</button>
      </nav>

      {activeTab === 'dashboard' && <GovernanceDashboard />}
      {activeTab === 'create' && <ProposalWizard />}
    </div>
  );
}
`;

/**
 * Example 14: Error Handling
 */
async function example14_ErrorHandling() {
  console.log('Example 14: Proper error handling');

  try {
    await createProposal(
      GOVERNANCE_CORE_ADDRESS,
      'Test Proposal',
      'Test description',
      undefined,
      undefined,
      undefined
    );
  } catch (error: any) {
    if (error.code === 'u9000') {
      console.error('Unauthorized: You need sufficient tokens to create a proposal');
    } else if (error.code === 'u9006') {
      console.error('Invalid parameters: Check your proposal data');
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Export all examples
export {
  example1_CreateSimpleProposal,
  example2_CreateProposalWithExecution,
  example3_VoteOnProposal,
  example4_CheckProposalStatus,
  example5_DelegateVotingPower,
  example6_RevokeDelegation,
  example7_CheckVotingPower,
  example8_ProposeTreasuryTransaction,
  example9_SignTreasuryTransaction,
  example10_ExecuteTreasuryTransaction,
  example11_CompleteProposalLifecycle,
  example12_MultiSigTreasuryWorkflow,
  example14_ErrorHandling,
  ReactIntegrationExample,
};

/**
 * Run all examples (for testing)
 */
async function runAllExamples() {
  console.log('=== Running All Governance Integration Examples ===\n');

  // Note: In production, you wouldn't run all these sequentially
  // This is for demonstration purposes only

  await example1_CreateSimpleProposal();
  await example2_CreateProposalWithExecution();
  await example3_VoteOnProposal(1);
  await example4_CheckProposalStatus(1);
  await example5_DelegateVotingPower('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');
  await example6_RevokeDelegation();
  await example7_CheckVotingPower('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
  await example8_ProposeTreasuryTransaction();
  await example9_SignTreasuryTransaction(1);
  await example10_ExecuteTreasuryTransaction(1);

  console.log('\n=== All Examples Completed ===');
}

// Uncomment to run examples
// runAllExamples().catch(console.error);
