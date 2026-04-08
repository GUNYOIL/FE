"use client";

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

type InstallPromptMode = "hidden" | "android" | "ios";

const DISMISS_KEY = "gunyoil-install-prompt-dismissed-v1";

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari() {
  const userAgent = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(userAgent);
  const isSafari = /safari/i.test(userAgent) && !/crios|fxios|edgios|chrome|android/i.test(userAgent);

  return isIos && isSafari;
}

export default function PwaInstallPrompt() {
  const [mode, setMode] = useState<InstallPromptMode>("hidden");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (localStorage.getItem(DISMISS_KEY) || isStandaloneMode()) {
      return;
    }

    if (isIosSafari()) {
      setMode("ios");
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setMode("android");
    };

    const handleAppInstalled = () => {
      localStorage.setItem(DISMISS_KEY, "installed");
      setDeferredPrompt(null);
      setMode("hidden");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const copy = useMemo(() => {
    if (mode === "ios") {
      return {
        title: "홈 화면에 추가",
        description: "Safari 공유 버튼을 누른 뒤 '홈 화면에 추가'를 선택하면 앱처럼 바로 열 수 있습니다.",
        action: "알겠어요",
      };
    }

    if (mode === "android") {
      return {
        title: "앱으로 설치",
        description: "홈 화면에 추가해 두면 브라우저 주소창 없이 근요일을 바로 실행할 수 있습니다.",
        action: "설치하기",
      };
    }

    return null;
  }, [mode]);

  const dismissPrompt = () => {
    localStorage.setItem(DISMISS_KEY, "dismissed");
    setDeferredPrompt(null);
    setMode("hidden");
  };

  const handlePrimaryAction = async () => {
    if (mode === "ios" || !deferredPrompt) {
      dismissPrompt();
      return;
    }

    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;

    if (result.outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, "installed");
      setMode("hidden");
    }

    setDeferredPrompt(null);
  };

  if (!copy || mode === "hidden") {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 z-40" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)" }}>
      <div className="mx-auto max-w-[480px] px-4">
        <div className="pointer-events-auto rounded-[24px] border border-[#E7EBEF] bg-[rgba(255,255,255,0.98)] px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-semibold text-[#191F28]">{copy.title}</p>
              <p className="mt-1 text-[13px] leading-5 text-[#6B7684]">{copy.description}</p>
            </div>
            <button
              aria-label="설치 안내 닫기"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F2F4F6] text-[#8B95A1]"
              onClick={dismissPrompt}
              type="button"
            >
              <svg fill="none" height="14" viewBox="0 0 14 14" width="14" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
              </svg>
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              className="h-11 flex-1 rounded-[16px] bg-[#191F28] px-4 text-[14px] font-semibold text-white"
              onClick={() => {
                handlePrimaryAction().catch(() => {
                  return undefined;
                });
              }}
              type="button"
            >
              {copy.action}
            </button>
            <button
              className="h-11 rounded-[16px] border border-[#E7EBEF] px-4 text-[14px] font-semibold text-[#4E5968]"
              onClick={dismissPrompt}
              type="button"
            >
              나중에
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
