"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    let isCancelled = false;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        if (isCancelled) {
          return;
        }

        await registration.update().catch(() => {
          return undefined;
        });

        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;

          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed" && registration.waiting) {
              registration.waiting.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      } catch {
        return undefined;
      }
    };

    registerServiceWorker();

    return () => {
      isCancelled = true;
    };
  }, []);

  return null;
}
