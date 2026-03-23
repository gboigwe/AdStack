import Link from 'next/link';
import {
  TrendingUp,
  Users,
  Shield,
  Zap,
  ArrowRight,
  Wallet,
  FileText,
  BarChart3,
  Vote,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Shield,
    title: 'Fraud Prevention',
    description:
      'Advanced on-chain verification to prevent click fraud and fake impressions.',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  {
    icon: TrendingUp,
    title: 'Real-time Analytics',
    description:
      'Track campaign performance with transparent, verifiable on-chain metrics.',
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
  {
    icon: Zap,
    title: 'Instant Payments',
    description:
      'Smart contract-powered automatic settlements with zero delays.',
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
  },
  {
    icon: Users,
    title: 'Decentralized Network',
    description:
      'Join a growing global network of publishers and advertisers.',
    color: 'text-purple-600',
    bg: 'bg-purple-100',
  },
] as const;

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: Wallet,
    title: 'Connect Wallet',
    description: 'Link your Stacks wallet to get started instantly.',
  },
  {
    step: 2,
    icon: FileText,
    title: 'Create Campaign',
    description:
      'Set your budget, targeting, and duration. Funds are held in escrow.',
  },
  {
    step: 3,
    icon: BarChart3,
    title: 'Track Performance',
    description:
      'Monitor views, clicks, and conversions with live on-chain data.',
  },
  {
    step: 4,
    icon: Vote,
    title: 'Govern Together',
    description:
      'Vote on protocol upgrades and fee structures via on-chain governance.',
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="px-4 pt-20 pb-20 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-7xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 font-medium mb-8">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            Built on Stacks &middot; Secured by Bitcoin
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Decentralized Advertising
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              for the Open Web
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Connect advertisers and publishers through transparent smart contracts.
            No middlemen, no fraud, no hidden fees — just verifiable results.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/advertiser"
              className="w-full sm:w-auto rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              Launch Campaign
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/publisher"
              className="w-full sm:w-auto rounded-lg border-2 border-gray-300 px-8 py-3.5 text-base font-semibold text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-colors flex items-center justify-center"
            >
              Become a Publisher
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Why Choose AdStack?
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Every transaction is recorded on the Stacks blockchain,
              giving both parties complete visibility and trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map(({ icon: Icon, title, description, color, bg }) => (
              <div
                key={title}
                className="relative p-6 rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all group"
              >
                <div
                  className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center mb-4`}
                >
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-gray-50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Get up and running in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }) => (
              <div key={step} className="text-center">
                <div className="relative inline-flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-white border-2 border-blue-200 rounded-full flex items-center justify-center">
                    <Icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {title}
                </h3>
                <p className="text-gray-600 text-sm">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-8">
              <div className="text-4xl font-bold text-blue-600">$0</div>
              <div className="mt-2 text-gray-600 font-medium">Platform Fees</div>
              <p className="text-sm text-gray-500 mt-1">
                100% of budget goes to publishers
              </p>
            </div>
            <div className="p-8">
              <div className="text-4xl font-bold text-blue-600">100%</div>
              <div className="mt-2 text-gray-600 font-medium">Transparent</div>
              <p className="text-sm text-gray-500 mt-1">
                Every transaction verifiable on-chain
              </p>
            </div>
            <div className="p-8">
              <div className="text-4xl font-bold text-blue-600">24/7</div>
              <div className="mt-2 text-gray-600 font-medium">Automated</div>
              <p className="text-sm text-gray-500 mt-1">
                Smart contracts never sleep
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Join the future of decentralized advertising today.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/advertiser"
              className="w-full sm:w-auto rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              Start Advertising
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/publisher"
              className="w-full sm:w-auto rounded-lg border-2 border-white/50 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              Monetize Your Site
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
