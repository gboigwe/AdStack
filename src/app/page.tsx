import Link from "next/link";
import { TrendingUp, Users, Shield, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="px-4 pt-20 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Decentralized Advertising <br />
            <span className="text-blue-600">Built on Stacks</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Connect advertisers and publishers through blockchain technology.
            Transparent, secure, and fraud-resistant advertising platform.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6">
            <Link
              href="/advertiser"
              className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Launch Campaign
            </Link>
            <Link
              href="/publisher"
              className="rounded-lg border-2 border-blue-600 px-6 py-3 text-base font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              Become a Publisher
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose AdStack?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Fraud Prevention
              </h3>
              <p className="text-gray-600">
                Advanced verification system to prevent click fraud and fake impressions
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Real-time Analytics
              </h3>
              <p className="text-gray-600">
                Track campaign performance with transparent, on-chain metrics
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Instant Payments
              </h3>
              <p className="text-gray-600">
                Smart contract-powered automatic settlements with no delays
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Decentralized Network
              </h3>
              <p className="text-gray-600">
                Join a global network of publishers and advertisers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600">$0</div>
              <div className="mt-2 text-gray-600">Platform Fees</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600">100%</div>
              <div className="mt-2 text-gray-600">Transparent</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600">24/7</div>
              <div className="mt-2 text-gray-600">Automated</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
