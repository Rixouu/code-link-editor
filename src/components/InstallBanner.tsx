'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other' | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Detect platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    
    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) return;

    if (isIOS) {
      setPlatform('ios');
      // Show banner for iOS if not shown in this session
      const hidden = sessionStorage.getItem('pwa-banner-hidden');
      if (!hidden) {
        setShowBanner(true);
      }
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('other');
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const hidden = sessionStorage.getItem('pwa-banner-hidden');
      if (!hidden) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  const closeBanner = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa-banner-hidden', 'true');
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
