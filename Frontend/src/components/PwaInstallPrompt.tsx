"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * beforeinstallprompt isn't in the standard TS DOM lib yet — declare the shape
 * we use so the native .prompt() flow types cleanly.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "flux_pwa_install_dismissed";

/**
 * Subtle, dismissible "Install app" banner (progressive enhancement).
 *
 * Shows only when the browser fires `beforeinstallprompt` (Chrome/Android/
 * desktop). iOS Safari never fires it — iOS users install via Share → "Add to
 * Home Screen", which needs no extra code beyond the apple-touch-icon and
 * appleWebApp meta tags. Once dismissed or once installed, the banner stays
 * hidden (localStorage).
 */
export default function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already running as an installed app — never prompt.
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Respect a previous dismiss so the banner doesn't nag on every visit.
    if (localStorage.getItem(DISMISS_KEY)) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setDeferred(null);
      setVisible(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible || !deferred) return null;

  const install = async () => {
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
    // If the user declined the native prompt, don't keep re-offering.
    if (choice.outcome !== "accepted") localStorage.setItem(DISMISS_KEY, "1");
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDeferred(null);
    setVisible(false);
  };

  return (
    <div className="pwaInstall" role="dialog" aria-label="Install Flux app">
      <div className="pwaInstallBody">
        <strong>Install Flux</strong>
        <span>Add Flux to your home screen for quick access.</span>
      </div>
      <button className="btn btnGold btnSm" onClick={install}>
        Install
      </button>
      <button className="pwaInstallClose" onClick={dismiss} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
