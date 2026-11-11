"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, PlusSquare, X } from "lucide-react";

const DISMISS_KEY = "install-app-dismissed";

// Chromium-only and missing from the DOM typings
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "hidden" | "ios" | "other";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

// iPadOS reports itself as a Mac, so a touch screen gives it away. Only
// Safari can add to the home screen reliably; other iOS browsers and in-app
// webviews are left alone.
function isIosSafari() {
  const ua = navigator.userAgent;
  const ios =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

function getPlatform(): Platform {
  if (isStandalone() || wasDismissed()) return "hidden";
  return isIosSafari() ? "ios" : "other";
}

const subscribe = () => () => {};

/**
 * Floating "Install app" pill. Chromium hands us an install prompt to replay;
 * iOS has no such event, so there the pill opens Share-sheet instructions.
 * Renders nothing on the server and until the browser proves it can install.
 */
export default function InstallAppPrompt() {
  const platform = useSyncExternalStore<Platform>(subscribe, getPlatform, () => "hidden");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [iosHelpOpen, setIosHelpOpen] = useState(false);

  useEffect(() => {
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setDeferred(null);
      setDismissed(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  async function install() {
    if (platform === "ios") {
      setIosHelpOpen((v) => !v);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    // The event can only be replayed once
    setDeferred(null);
  }

  const visible =
    !dismissed && (platform === "ios" || (platform === "other" && deferred !== null));
  if (!visible) return null;

  return (
    <div className="fixed bottom-5 left-5 z-40 flex flex-col items-start gap-2">
      {iosHelpOpen && (
        <div className="max-w-[260px] rounded-2xl border border-[#EDE5D8] bg-[#FAF8F5] p-4 shadow-lg">
          <p className="text-sm font-bold text-[#1C1C1C]">Install Sanatani Seva</p>
          <ol className="mt-2 space-y-1.5 text-xs text-[#6B6B6B]">
            <li className="flex items-center gap-1.5">
              1. Tap the Share button
              <Share className="h-3.5 w-3.5 text-[#C8541A]" />
            </li>
            <li className="flex items-center gap-1.5">
              2. Choose &ldquo;Add to Home Screen&rdquo;
              <PlusSquare className="h-3.5 w-3.5 text-[#C8541A]" />
            </li>
          </ol>
        </div>
      )}

      <div className="flex items-center bg-[#1C0A00] text-white rounded-full shadow-lg">
        <button
          type="button"
          onClick={install}
          aria-expanded={platform === "ios" ? iosHelpOpen : undefined}
          className="flex items-center gap-2 pl-4 pr-2 py-3 hover:opacity-90 transition-opacity"
        >
          <Download className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Install app
          </span>
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="pl-1 pr-3 py-3 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
