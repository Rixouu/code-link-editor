'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Platform = 'ios' | 'android' | 'other' | null;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function InstallBanner() {
  const [platform] = useState<Platform>(() => {
    if (typeof window === 'undefined') return null;
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    return 'other';
  });

  const [showBanner, setShowBanner] = useState(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean(nav.standalone) ||
      document.referrer.includes('android-app://');
    if (isStandalone) return false;
    if (!isIOS) return false;
    try {
      const hidden = sessionStorage.getItem('pwa-banner-hidden');
      return !hidden;
    } catch {
      return false;
    }
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean(nav.standalone) ||
      document.referrer.includes('android-app://');
    if (isStandalone) return;

    const handler = (e: Event) => {
      const evt = e as BeforeInstallPromptEvent;
      evt.preventDefault();
      setDeferredPrompt(evt);
      try {
        const hidden = sessionStorage.getItem('pwa-banner-hidden');
        if (!hidden) setShowBanner(true);
      } catch {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);

    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  const closeBanner = () => {
    setShowBanner(false);
    try {
      sessionStorage.setItem('pwa-banner-hidden', 'true');
    } catch {}
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 p-4 text-white shadow-2xl backdrop-blur-xl ring-1 ring-white/20">
        {/* Glow effect */}
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-teal-500/20 blur-3xl"></div>
        
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg">
            <Download className="h-6 w-6 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-bold tracking-tight">Install App</h3>
            <p className="text-xs text-slate-300">
              {platform === 'ios' 
                ? 'Tap the share button and "Add to Home Screen"'
                : 'Add Code Link Editor to your home screen for the best experience.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {platform === 'ios' ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <Share className="h-4 w-4" />
              </div>
            ) : deferredPrompt ? (
              <Button 
                size="sm" 
                onClick={handleInstall}
                className="bg-teal-500 text-white hover:bg-teal-600"
              >
                Install
              </Button>
            ) : null}
            
            <button 
              onClick={closeBanner}
              aria-label="Close install banner"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
