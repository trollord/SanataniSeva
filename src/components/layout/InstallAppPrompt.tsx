"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Download, Share, PlusSquare, X } from "lucide-react";

const DISMISS_KEY = "install-app-dismissed";

// Chromium-only and missing from the DOM typings
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "standalone" | "ios" | "other";

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

// iPadOS reports itself as a Mac, so a touch screen gives it away. No iOS
// browser fires an install event, but since iOS 16.4 Chrome, Edge and Firefox
// can add to the home screen from their Share menu just as Safari does, so
// they all get the same Share-sheet steps.
function isIos() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function getPlatform(): Platform {
  if (isStandalone()) return "standalone";
  return isIos() ? "ios" : "other";
}

const subscribe = () => () => {};

/**
 * Install state shared by the floating pill and the home-page button.
 * Chromium hands us an install prompt to replay; iOS has no such event, so
 * there the caller shows Share-sheet instructions instead.
 */
function useInstallApp() {
  // `null` on the server and during hydration: the platform is not known yet.
  const platform = useSyncExternalStore<Platform | null>(subscribe, getPlatform, () => null);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setDeferred(null);
      setInstalled(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  /** Resolves false when the browser refused to show its dialog. */
  async function promptInstall() {
    if (!deferred) return false;
    try {
      await deferred.prompt();
      return true;
    } catch {
      return false;
    } finally {
      // The event can only be replayed once
      setDeferred(null);
    }
  }

  return {
    platform,
    installed: installed || platform === "standalone",
    canPrompt: deferred !== null,
    promptInstall,
  };
}

/** The how-to card, for browsers that give us no install prompt to trigger. */
function InstallSteps({ ios }: { ios: boolean }) {
  return (
    <div className="max-w-[260px] rounded-2xl border border-[#EDE5D8] bg-[#FAF8F5] p-4 shadow-lg">
      <p className="text-sm font-bold text-[#1C1C1C]">Install Sanatani Seva</p>
      {ios ? (
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
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-[#6B6B6B]">
          Open your browser&rsquo;s menu and choose &ldquo;Install app&rdquo;,
          &ldquo;Add to Home screen&rdquo; or &ldquo;Add to Dock&rdquo;.
        </p>
      )}
    </div>
  );
}

/**
 * Floating "Install app" pill. Renders nothing on the server and until the
 * browser proves it can install. Not shown on the home page, which carries
 * its own install button in the masthead.
 */
export default function InstallAppPrompt() {
  const pathname = usePathname();
  const { platform, installed, canPrompt, promptInstall } = useInstallApp();
  // Read once the platform is known, i.e. only ever in the browser.
  const [dismissed, setDismissed] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  const visible =
    pathname !== "/" &&
    platform !== null &&
    !installed &&
    !dismissed &&
    !wasDismissed() &&
    (platform === "ios" || canPrompt);
  if (!visible) return null;

  return (
    <div className="fixed bottom-5 left-5 z-40 flex flex-col items-start gap-2">
      {helpOpen && <InstallSteps ios />}

      <div className="flex items-center bg-[#1C0A00] text-white rounded-full shadow-lg">
        <button
          type="button"
          onClick={() => (platform === "ios" ? setHelpOpen((v) => !v) : promptInstall())}
          aria-expanded={platform === "ios" ? helpOpen : undefined}
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

/**
 * Inline "Install app" button for page content; the caller supplies the
 * button styling. Always rendered (so the layout never shifts) except when
 * the site is already running as the installed app. Where the browser offers
 * no prompt to trigger, it opens the how-to card instead.
 */
export function InstallAppButton({ className }: { className: string }) {
  const { platform, installed, canPrompt, promptInstall } = useInstallApp();
  const [helpOpen, setHelpOpen] = useState(false);

  if (installed) return null;

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={async () => {
          // No prompt to trigger, or the browser refused it: show the steps.
          if (!canPrompt || !(await promptInstall())) setHelpOpen((v) => !v);
        }}
        aria-expanded={canPrompt ? undefined : helpOpen}
        className={className}
      >
        <Download aria-hidden className="h-4 w-4" />
        Install app
      </button>
      {helpOpen && !canPrompt && <InstallSteps ios={platform === "ios"} />}
    </div>
  );
}
