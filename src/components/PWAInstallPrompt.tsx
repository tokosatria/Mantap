'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2, Menu } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      // Check if running in standalone mode
      const isStandalone =
        (window.matchMedia('(display-mode: standalone)').matches) ||
        ('standalone' in window.navigator && (window.navigator as any).standalone === true);

      setIsInstalled(isStandalone);
    };

    // Check if iOS device
    const checkIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIOS(isIOSDevice);
    };

    checkInstalled();
    checkIOS();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);

      // Show prompt after 3 seconds if not dismissed
      if (!isInstalled && !dismissed) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, dismissed]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
  };

  // Don't show if:
  // - App is already installed
  // - No deferred prompt available and not iOS
  // - User has dismissed the prompt
  if (isInstalled || (!deferredPrompt && !isIOS) || dismissed) {
    return null;
  }

  // Show iOS instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4 duration-500">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-[var(--text-primary)] mb-1">
                Install App
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Untuk menginstall Satria Elektronik:
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-[var(--text-secondary)]">
                    Tap icon <strong>Share</strong> di Safari
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Menu className="w-4 h-4 text-cyan-400" />
                  <span className="text-[var(--text-secondary)]">
                    Scroll dan tap <strong>Add to Home Screen</strong>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show install prompt for Android/Chrome
  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-[var(--text-primary)] mb-1">
              Install Satria Elektronik
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Install app untuk pengalaman yang lebih baik dan akses cepat dari home screen.
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 btn-primary bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-300"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors text-sm"
              >
                Nanti
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
