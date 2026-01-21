/**
 * Complete Campaign Workflow Example
 * Demonstrates full campaign lifecycle from creation to payout
 */

import {
  createCampaign,
  fundCampaign,
  activateCampaign,
  CampaignState
} from '../src/lib/contracts/campaign-lifecycle';
import { createEscrow, releaseEscrow } from '../src/lib/contracts/escrow-vault';
import { createPayoutBatch, executePayoutBatch } from '../src/lib/contracts/payout-automation';
import { createMilestone, claimMilestoneBonus } from '../src/lib/contracts/milestone-tracker';
import { getStacksNetwork } from '../src/lib/stacks-config';

// Configuration
const NETWORK = getStacksNetwork();
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
const USER_ADDRESS = 'SP3BXJENEWVNCFYGJF75DFS478H1BZJXNZPT84EAD';

/**
 * Step 1: Create Campaign
 */
export async function step1_createCampaign() {
  console.log('📝 Step 1: Creating campaign...');

  const campaignData = {
    name: 'Holiday Sale 2026',
    budget: 50000000000n, // 50,000 STX
    fundingThreshold: 40000000000n, // 40,000 STX
    startTime: Math.floor(Date.now() / 1000) + 86400, // Tomorrow
    endTime: Math.floor(Date.now() / 1000) + 2592000, // 30 days
    metadata: JSON.stringify({
      description: 'End of year holiday sale campaign',
      targetAudience: 'Crypto enthusiasts aged 25-45',
      objectives: ['Brand Awareness', 'Conversions'],
      channels: ['Display Ads', 'Social Media']
    }),
    network: NETWORK,
    contractAddress: CONTRACT_ADDRESS
  };

  return new Promise((resolve, reject) => {
    createCampaign({
      ...campaignData,
      onFinish: (data) => {
        console.log('✅ Campaign created:', data);
        resolve(data);
      },
      onCancel: () => {
        console.log('❌ Campaign creation cancelled');
        reject(new Error('User cancelled'));
      }
    });
  });
}

/**
 * Step 2: Fund Campaign
 */
export async function step2_fundCampaign(campaignId: number) {
  console.log('💰 Step 2: Funding campaign...');

  return new Promise((resolve, reject) => {
    fundCampaign({
      campaignId,
      amount: 45000000000n, // 45,000 STX (above threshold)
      network: NETWORK,
      contractAddress: CONTRACT_ADDRESS,
      userAddress: USER_ADDRESS,
      onFinish: (data) => {
        console.log('✅ Campaign funded and auto-activated:', data);
        resolve(data);
      },
      onCancel: () => {
        console.log('❌ Funding cancelled');
        reject(new Error('User cancelled'));
      }
    });
  });
}

/**
 * Step 3: Create Escrow for Publisher
 */
export async function step3_createEscrow(campaignId: number) {
  console.log('🔒 Step 3: Creating escrow for publisher...');

  return new Promise((resolve, reject) => {
    createEscrow({
      campaignId,
      beneficiary: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      amount: 10000000000n, // 10,000 STX
      timeLockDuration: 86400, // 24 hours
      performanceThreshold: 75, // 75% performance required
      expiresIn: 2592000, // 30 days
      requiredApprovers: [
        'SP3BXJENEWVNCFYGJF75DFS478H1BZJXNZPT84EAD',
        'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
      ],
      network: NETWORK,
      contractAddress: CONTRACT_ADDRESS,
      userAddress: USER_ADDRESS,
      onFinish: (data) => {
        console.log('✅ Escrow created:', data);
        resolve(data);
      },
      onCancel: () => {
        console.log('❌ Escrow creation cancelled');
        reject(new Error('User cancelled'));
      }
    });
  });
}

/**
 * Step 4: Set Up Milestones
 */
export async function step4_setupMilestones(campaignId: number) {
  console.log('🎯 Step 4: Setting up campaign milestones...');

  const milestones = [
    {
      type: 1, // Views
      target: 100000,
      bonus: 1000000000n, // 1,000 STX
      description: 'Reach 100k views'
    },
    {
      type: 2, // Clicks
      target: 5000,
      bonus: 1500000000n, // 1,500 STX
      description: 'Achieve 5k clicks'
    },
    {
      type: 3, // Conversions
      target: 250,
      bonus: 2500000000n, // 2,500 STX
      description: 'Generate 250 conversions'
    }
  ];

  const promises = milestones.map(milestone =>
    new Promise((resolve, reject) => {
      createMilestone({
        campaignId,
        milestoneType: milestone.type,
        targetValue: milestone.target,
        bonusAmount: milestone.bonus,
        description: milestone.description,
        network: NETWORK,
        contractAddress: CONTRACT_ADDRESS,
        onFinish: resolve,
        onCancel: reject
      });
    })
  );

  const results = await Promise.all(promises);
  console.log('✅ All milestones created:', results);
  return results;
}

/**
 * Step 5: Simulate Campaign Running (Mock Performance Data)
 */
export async function step5_simulateCampaignProgress() {
  console.log('⏳ Step 5: Simulating campaign progress...');
  console.log('Campaign is running...');
  console.log('- Views accumulating...');
  console.log('- Clicks being recorded...');
  console.log('- Conversions happening...');
  console.log('- Performance oracle updating metrics...');

  // In real scenario, this would be performance oracle updates
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('✅ Campaign completed successfully!');
  console.log('Final metrics:');
  console.log('  - Views: 125,000');
  console.log('  - Clicks: 6,200');
  console.log('  - Conversions: 287');
  console.log('  - CTR: 4.96%');
  console.log('  - CVR: 4.63%');
  console.log('  - ROI: 156%');
}

/**
 * Step 6: Claim Milestone Bonuses
 */
export async function step6_claimBonuses(campaignId: number, milestoneIds: number[]) {
  console.log('🎁 Step 6: Claiming milestone bonuses...');

  const promises = milestoneIds.map(milestoneId =>
    new Promise((resolve, reject) => {
      claimMilestoneBonus({
        campaignId,
        milestoneId,
        network: NETWORK,
        contractAddress: CONTRACT_ADDRESS,
        onFinish: resolve,
        onCancel: reject
      });
    })
  );

  const results = await Promise.all(promises);
  console.log('✅ All bonuses claimed:', results);
  return results;
}

/**
 * Step 7: Release Escrow to Publisher
 */
export async function step7_releaseEscrow(escrowId: number) {
  console.log('💸 Step 7: Releasing escrow to publisher...');

  return new Promise((resolve, reject) => {
    releaseEscrow({
      escrowId,
      network: NETWORK,
      contractAddress: CONTRACT_ADDRESS,
      onFinish: (data) => {
        console.log('✅ Escrow released:', data);
        resolve(data);
      },
      onCancel: () => {
        console.log('❌ Escrow release cancelled');
        reject(new Error('User cancelled'));
      }
    });
  });
}

/**
 * Step 8: Process Batch Payouts to Publishers
 */
export async function step8_processBatchPayouts(campaignId: number) {
  console.log('💳 Step 8: Processing batch payouts...');

  const recipients = [
    { recipient: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7', amount: 5000000000n },
    { recipient: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE', amount: 3500000000n },
    { recipient: 'SP1P72Z3704VMT3DMHPP2CB8TGQWGDBHD3RPR9GZS', amount: 2500000000n },
    { recipient: 'SPNWZ5V2TPWGQGVDR6T7B6RQ4XMGZ4PXTEE0VQ0S', amount: 2000000000n }
  ];

  // Create batch
  const batchId = await new Promise<number>((resolve, reject) => {
    createPayoutBatch({
      campaignId,
      recipients,
      network: NETWORK,
      contractAddress: CONTRACT_ADDRESS,
      onFinish: (data) => {
        console.log('✅ Payout batch created:', data);
        resolve(data.value);
      },
      onCancel: reject
    });
  });

  // Execute batch
  return new Promise((resolve, reject) => {
    executePayoutBatch({
      batchId,
      network: NETWORK,
      contractAddress: CONTRACT_ADDRESS,
      onFinish: (data) => {
        console.log('✅ Batch payouts executed:', data);
        console.log(`💰 Total paid: ${recipients.reduce((sum, r) => sum + r.amount, 0n) / 1000000n} STX`);
        resolve(data);
      },
      onCancel: reject
    });
  });
}

/**
 * Run Complete Workflow
 */
export async function runCompleteWorkflow() {
  console.log('🚀 Starting complete campaign workflow...\n');

  try {
    // Step 1: Create Campaign
    const campaignResult = await step1_createCampaign();
    const campaignId = 1; // Extract from result in production

    // Step 2: Fund Campaign
    await step2_fundCampaign(campaignId);

    // Step 3: Create Escrow
    const escrowResult = await step3_createEscrow(campaignId);
    const escrowId = 1; // Extract from result in production

    // Step 4: Setup Milestones
    const milestoneResults = await step4_setupMilestones(campaignId);
    const milestoneIds = [1, 2, 3]; // Extract from results in production

    // Step 5: Simulate Campaign Running
    await step5_simulateCampaignProgress();

    // Step 6: Claim Milestone Bonuses
    await step6_claimBonuses(campaignId, milestoneIds);

    // Step 7: Release Escrow
    await step7_releaseEscrow(escrowId);

    // Step 8: Process Batch Payouts
    await step8_processBatchPayouts(campaignId);

    console.log('\n🎉 Complete workflow executed successfully!');
    console.log('Campaign lifecycle completed from creation to final payout.');

  } catch (error) {
    console.error('❌ Workflow error:', error);
    throw error;
  }
}

// Export for use in applications
export default {
  step1_createCampaign,
  step2_fundCampaign,
  step3_createEscrow,
  step4_setupMilestones,
  step5_simulateCampaignProgress,
  step6_claimBonuses,
  step7_releaseEscrow,
  step8_processBatchPayouts,
  runCompleteWorkflow
};
