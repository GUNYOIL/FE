"use client";

import { useEffect } from "react";
import { recordFcmDebugEntry } from "@/lib/fcm-debug";

const PWA_LOG_PREFIX = "[FCM]";

function createTimestampDetails() {
  const now = new Date();

  return {
    at: now.toISOString(),
    epoch_ms: now.getTime(),
    perf_ms: typeof performance !== "undefined" ? Number(performance.now().toFixed(1)) : null,
  };
}

function logPwa(event: string, details: Record<string, unknown> = {}) {
  const payload = {
    ...createTimestampDetails(),
    ...details,
  };

  console.info(PWA_LOG_PREFIX, event, payload);
  recordFcmDebugEntry({
    prefix: PWA_LOG_PREFIX,
    event,
    details: payload,
    source: "page",
  });
}

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      logPwa("pwa.service_worker_skipped", {
        reason: "service_worker_unsupported",
      });
      return;
    }

    let isCancelled = false;

    const registerServiceWorker = async () => {
      try {
        logPwa("pwa.service_worker_register_start", {
          path: "/sw.js",
          scope: "/",
        });

        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        if (isCancelled) {
          return;
        }

        logPwa("pwa.service_worker_register_success", {
          scope: registration.scope,
          active_state: registration.active?.state ?? null,
          installing_state: registration.installing?.state ?? null,
          waiting_state: registration.waiting?.state ?? null,
        });

        await registration.update().catch(() => {
          logPwa("pwa.service_worker_update_ignored");
          return undefined;
        });

        if (registration.waiting) {
          logPwa("pwa.service_worker_waiting", {
            waiting_state: registration.waiting.state,
          });
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        registration.addEventListener("updatefound", () => {
          logPwa("pwa.service_worker_updatefound");
          const installingWorker = registration.installing;

          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener("statechange", () => {
            logPwa("pwa.service_worker_statechange", {
              installing_state: installingWorker.state,
            });
            if (installingWorker.state === "installed" && registration.waiting) {
              registration.waiting.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      } catch (error) {
        logPwa("pwa.service_worker_register_error", {
          error_name: error instanceof Error ? error.name : null,
          error_message: error instanceof Error ? error.message : String(error),
        });
        return undefined;
      }
    };

    registerServiceWorker();

    return () => {
      logPwa("pwa.service_worker_unmount");
      isCancelled = true;
    };
  }, []);

  return null;
}
