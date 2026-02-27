import { openContractCall } from '@stacks/connect';
import { Cl, PostConditionMode } from '@stacks/transactions';

const DEPLOYER = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

async function createTargetingSegment() {
  await openContractCall({
    contractAddress: DEPLOYER,
    contractName: 'targeting-engine',
    functionName: 'create-audience-segment',
    functionArgs: [
      Cl.stringUtf8('DeFi Power Users'),
      Cl.stringUtf8('Active DeFi participants aged 25-40 in North America'),
      Cl.uint(25),
      Cl.uint(40),
      Cl.list([Cl.stringAscii('US'), Cl.stringAscii('CA')]),
      Cl.list([
        Cl.stringAscii('defi'),
        Cl.stringAscii('trading'),
        Cl.stringAscii('yield-farming'),
      ]),
      Cl.list([]),
      Cl.uint(60),
      Cl.list([Cl.uint(1), Cl.uint(2)]),
      Cl.list([Cl.stringAscii('en')]),
      Cl.uint(4),
      Cl.uint(9),
      Cl.uint(0),
    ],
    postConditionMode: PostConditionMode.Deny,
    postConditions: [],
    onFinish: (data) => {
      console.log('Segment created, tx:', data.txId);
    },
  });
}

async function setupUserProfile() {
  await openContractCall({
    contractAddress: DEPLOYER,
    contractName: 'targeting-engine',
    functionName: 'set-user-profile',
    functionArgs: [
      Cl.list([
        Cl.stringAscii('defi'),
        Cl.stringAscii('trading'),
        Cl.stringAscii('nfts'),
      ]),
      Cl.list([Cl.uint(85), Cl.uint(70), Cl.uint(55)]),
      Cl.uint(30),
      Cl.stringAscii('US'),
      Cl.stringAscii('desktop'),
      Cl.stringAscii('en'),
      Cl.uint(6),
      Cl.uint(1),
    ],
    postConditionMode: PostConditionMode.Deny,
    postConditions: [],
    onFinish: (data) => {
      console.log('Profile set, tx:', data.txId);
    },
  });
}

async function grantTargetingConsent() {
  await openContractCall({
    contractAddress: DEPLOYER,
    contractName: 'privacy-layer',
    functionName: 'grant-consent',
    functionArgs: [
      Cl.uint(1),
      Cl.uint(1),
      Cl.stringUtf8('I consent to demographic targeting for ad personalization'),
    ],
    postConditionMode: PostConditionMode.Deny,
    postConditions: [],
    onFinish: (data) => {
      console.log('Consent granted, tx:', data.txId);
    },
  });
}

async function createAudienceSegment() {
  await openContractCall({
    contractAddress: DEPLOYER,
    contractName: 'audience-segments',
    functionName: 'create-segment',
    functionArgs: [
      Cl.stringUtf8('Crypto Newcomers'),
      Cl.stringUtf8('Users new to crypto looking for entry-level products'),
      Cl.uint(1),
      Cl.uint(5000),
      Cl.uint(30),
      Cl.list([
        Cl.stringAscii('crypto-basics'),
        Cl.stringAscii('wallets'),
        Cl.stringAscii('exchanges'),
      ]),
    ],
    postConditionMode: PostConditionMode.Deny,
    postConditions: [],
    onFinish: (data) => {
      console.log('Audience segment created, tx:', data.txId);
    },
  });
}

async function fullTargetingWorkflow() {
  console.log('Step 1: Grant targeting consent');
  await grantTargetingConsent();

  console.log('Step 2: Set up user profile');
  await setupUserProfile();

  console.log('Step 3: Create targeting segment');
  await createTargetingSegment();

  console.log('Step 4: Create audience segment');
  await createAudienceSegment();

  console.log('Targeting workflow complete');
}

export {
  createTargetingSegment,
  setupUserProfile,
  grantTargetingConsent,
  createAudienceSegment,
  fullTargetingWorkflow,
};
