'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, X, Smartphone, Monitor, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const DISMISS_KEY = 'adstack-install-prompt-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone)
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < DISMISS_DURATION) return;

    if (isIOS()) {
      const timer = setTimeout(() => setShowIOSGuide(true), 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    setInstalling(true);
    await deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
    setInstalling(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }, []);

  if (showIOSGuide) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white rounded-xl border border-gray-200 shadow-lg p-4 z-50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">Install AdStack</h3>
          </div>
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Install AdStack on your device for quick access and an app-like experience.
        </p>
        <ol className="text-sm text-gray-600 space-y-2">
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">1</span>
            <span>Tap the <Share className="w-4 h-4 inline text-blue-600" /> Share button</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">2</span>
            <span>Scroll and tap &quot;Add to Home Screen&quot;</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">3</span>
            <span>Tap &quot;Add&quot; to confirm</span>
          </li>
        </ol>
      </div>
    );
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white rounded-xl border border-gray-200 shadow-lg p-4 z-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Install AdStack</h3>
        </div>
        <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Install AdStack for faster access, offline support, and push notifications.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={handleInstall}
          disabled={installing}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          {installing ? 'Installing...' : 'Install'}
        </button>
        <button
          onClick={handleDismiss}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  );
}
