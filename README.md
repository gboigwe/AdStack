# AdStack - Decentralized Advertising Protocol

## Overview
AdStack is a decentralized advertising protocol built on the Stacks blockchain that creates a transparent, efficient, and user-centric advertising ecosystem. The protocol enables direct interactions between advertisers, publishers, and users while ensuring fair compensation and verifiable ad delivery.

## 🌟 Features

### For Advertisers
- Create and manage advertising campaigns using STX tokens
- Real-time campaign performance metrics with WebSocket updates
- Verifiable ad delivery and engagement statistics
- Smart contract-based payment automation
- Flexible subscription plans (Free, Basic, Pro, Enterprise)
- Usage-based pricing with soft and hard limits
- Advanced analytics and custom targeting (Pro+)

### For Publishers
- Easy platform integration
- Automated, instant payments
- Transparent revenue sharing
- Fraud-resistant view verification
- Tiered subscription benefits
- White-label options (Pro+)
- Priority support (Pro+)

### For Users
- Opt-in ad viewing
- Token rewards for engagement
- Data privacy controls
- Transparent reward distribution
- Participation in platform governance through DAO
- Voting rights on platform decisions

### Subscription & Billing
- 4 Subscription Tiers: Free, Basic ($29/mo), Pro ($99/mo), Enterprise ($299/mo)
- Automated recurring payments with STX or fiat
- Payment retry logic (max 3 attempts) with grace periods
- Proration for mid-cycle plan changes
- Usage tracking across 8 metrics (campaigns, impressions, clicks, conversions, API calls, team members, storage, reports)
- Feature gating based on subscription tier
- Invoice generation and billing history
- Email notifications for payments, renewals, and usage limits

### Governance & DAO
- Decentralized governance with on-chain voting
- Proposal creation and voting mechanisms
- Multi-signature treasury management
- Execution queue with timelock security
- Token-weighted voting with delegation support
- Emergency actions and cancellation capabilities

## 🏗️ Technical Architecture

### Smart Contracts

**Core Advertising System:**
- `campaign-manager.clar`: Handles campaign creation and management
- `view-verifier.clar`: Implements proof-of-view mechanism
- `payment-distributor.clar`: Manages reward distribution
- `user-registry.clar`: Handles user registration and preferences

**Subscription & Payments:**
- `subscription-manager.clar`: Subscription lifecycle management (plans, enrollments, renewals, cancellations)
- `recurring-payment.clar`: Automated payment processing with retry logic and refund handling
- `subscription-benefits.clar`: Feature gating, usage limits, and tier management

**Governance:**
- `governance-token.clar`: DAO governance token with voting capabilities
- `dao-core.clar`: Core DAO functionality with multi-sig support
- `proposal-voting.clar`: Proposal creation and voting mechanism
- `treasury-manager.clar`: DAO treasury management

### Frontend Components

**Campaign Management:**
- Campaign Dashboard
- Publisher Interface
- User Wallet Integration
- Real-Time Analytics Dashboard (WebSocket-powered)

**Subscription System:**
- Subscription Plans & Pricing
- Checkout Flow with Payment Integration
- Usage Tracking & Limits Dashboard
- Billing History & Invoice Management
- Payment Methods Management
- Plan Upgrade/Downgrade Flows

**Governance:**
- DAO Governance Dashboard
- Proposal Creation & Voting Interface
- Treasury Management
- Multi-Signature Transaction Builder

## 📦 Repository Structure
```
adstack/
├── contracts/                          # Clarity smart contracts
│   ├── campaign-manager.clar           # Campaign management
│   ├── view-verifier.clar              # Proof-of-view mechanism
│   ├── payment-distributor.clar        # Reward distribution
│   ├── user-registry.clar              # User registration
│   ├── subscription-manager.clar       # Subscription lifecycle
│   ├── recurring-payment.clar          # Payment automation
│   ├── subscription-benefits.clar      # Feature gating & usage limits
│   ├── governance-token.clar           # DAO governance token
│   ├── dao-core.clar                   # DAO core functionality
│   ├── proposal-voting.clar            # Proposal & voting
│   └── treasury-manager.clar           # Treasury management
├── tests/                              # Contract test files
│   ├── campaign-manager_test.ts
│   ├── subscription-manager_test.ts    # 90+ test cases
│   ├── recurring-payment_test.ts       # 74+ test cases
│   ├── subscription-benefits_test.ts   # 101+ test cases
│   └── ...
├── frontend/                           # Web interface
│   ├── src/
│   │   ├── components/
│   │   │   ├── subscription/           # Subscription UI components
│   │   │   └── governance/             # Governance UI components
│   │   ├── hooks/
│   │   │   ├── useSubscription.ts      # Subscription hooks
│   │   │   └── useUsage.ts             # Usage tracking hooks
│   │   └── lib/
│   │       └── subscription.ts         # Subscription utilities
│   ├── public/
│   └── ...
├── backend/                            # Backend services
│   ├── api/
│   │   └── subscription.ts             # RESTful subscription API
│   ├── services/
│   │   └── subscription.ts             # Business logic
│   ├── middleware/
│   │   ├── auth.ts                     # Authentication
│   │   ├── rateLimiter.ts              # Tier-based rate limiting
│   │   ├── validation.ts               # Input validation
│   │   └── errorHandler.ts             # Error handling
│   ├── db/
│   │   ├── schema.sql                  # Database schema
│   │   └── migrations/                 # Database migrations
│   ├── templates/
│   │   └── emails/                     # Email templates
│   └── config/
│       └── config.ts                   # Application configuration
├── examples/                           # Integration examples
│   ├── subscription/
│   │   ├── subscription-integration.tsx
│   │   └── README.md
│   └── governance/
│       └── README.md
├── scripts/                            # Deployment and utility scripts
│   └── ...
└── docs/                               # Additional documentation
    ├── SUBSCRIPTION_SYSTEM.md          # Subscription system docs
    ├── GOVERNANCE_SYSTEM.md            # Governance system docs
    └── ...
```

## 🚀 Getting Started

### Prerequisites
- Stacks CLI
- Node.js (v14 or higher)
- Clarity VSCode Extension (recommended)

### Installation
1. Clone the repository:
```bash
git clone https://github.com/gboigwe/adstack.git
cd adstack
```

2. Install dependencies:
```bash
npm install
```

3. Run local test environment:
```bash
npm run test-chain
```

### Running Tests
```bash
# Run all contract tests
npm run test

# Run specific test suite
npm run test -- subscription-manager_test.ts
npm run test -- recurring-payment_test.ts
npm run test -- subscription-benefits_test.ts
```

### Environment Setup
1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your configuration:
   - Database connection string
   - Stacks network settings
   - JWT secret for authentication
   - Email service API keys
   - Stripe keys for payment processing

3. Run database migrations:
```bash
npm run migrate
```
<!-- 
## 💻 Development

### Local Development
1. Start local Stacks blockchain:
```bash
npm run start-chain
```

2. Deploy contracts:
```bash
npm run deploy-contracts
```

3. Start frontend:
```bash
cd frontend
npm start
``` -->

## 🤝 Contributing
We welcome contributions to AdStack! Please read our contributing guidelines before submitting pull requests.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📚 Documentation

- **[Subscription System Guide](docs/SUBSCRIPTION_SYSTEM.md)** - Complete guide to the subscription and payment system
- **[Governance System Guide](docs/GOVERNANCE_SYSTEM.md)** - DAO governance documentation
- **[Integration Examples](examples/)** - Code examples for integrating subscription and governance features
- **[API Documentation](backend/api/)** - RESTful API reference
- **[Smart Contract Reference](contracts/)** - Detailed contract documentation

## 🔗 Resources
- [Stacks Documentation](https://docs.stacks.co)
- [Clarity Language Reference](https://docs.stacks.co/clarity/introduction)
- [React Query Documentation](https://tanstack.com/query/latest)

## 🧪 Test Coverage

- **265+ Total Test Cases** across all smart contracts
- **subscription-manager_test.ts**: 90+ tests for subscription lifecycle
- **recurring-payment_test.ts**: 74+ tests for payment processing
- **subscription-benefits_test.ts**: 101+ tests for feature gating and usage limits
- **Comprehensive coverage** of edge cases, error conditions, and access control

## 📞 Contact
<!-- - Discord: [Join our community](discord-link)
- Twitter: [@AdStackProtocol](twitter-link) -->
- Email: contact@adstack.com
