import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const serviceWorkerResetScript = `(function () {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  var swReloadKey = "gunyoil-sw-reset-v1";
  var runtimeReloadKey = "gunyoil-runtime-recover-v1";

  function shouldRecoverFromError(message) {
    if (!message) {
      return false;
    }

    return (
      message.indexOf("__webpack_modules__[moduleId] is not a function") >= 0 ||
      message.indexOf("ChunkLoadError") >= 0 ||
      message.indexOf("Loading chunk") >= 0 ||
      message.indexOf("Failed to fetch dynamically imported module") >= 0
    );
  }

  function resetClientCaches() {
    return Promise.all([
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        var hadRegistrations = registrations.length > 0;

        return Promise.all(
          registrations.map(function (registration) {
            return registration.unregister().catch(function () {
              return false;
            });
          }),
        ).then(function () {
          return hadRegistrations;
        });
      }),
      "caches" in window
        ? caches.keys().then(function (keys) {
            var hadCaches = keys.length > 0;

            return Promise.all(
              keys.map(function (key) {
                return caches.delete(key);
              }),
            ).then(function () {
              return hadCaches;
            });
          })
        : Promise.resolve(false),
    ]);
  }

  function reloadOnce(key) {
    if (sessionStorage.getItem(key)) {
      return;
    }

    sessionStorage.setItem(key, "1");
    window.location.reload();
  }

  window.addEventListener(
    "error",
    function (event) {
      if (!shouldRecoverFromError(event && event.message)) {
        return;
      }

      resetClientCaches()
        .catch(function () {
          return undefined;
        })
        .finally(function () {
          reloadOnce(runtimeReloadKey);
        });
    },
    true,
  );

  window.addEventListener("unhandledrejection", function (event) {
    var reason = event && event.reason;
    var message =
      typeof reason === "string"
        ? reason
        : reason && typeof reason.message === "string"
          ? reason.message
          : "";

    if (!shouldRecoverFromError(message)) {
      return;
    }

    resetClientCaches()
      .catch(function () {
        return undefined;
      })
      .finally(function () {
        reloadOnce(runtimeReloadKey);
      });
  });

  resetClientCaches()
    .then(function (results) {
      if ((results[0] || results[1]) && !sessionStorage.getItem(swReloadKey)) {
        sessionStorage.setItem(swReloadKey, "1");
        window.location.reload();
        return;
      }

      sessionStorage.removeItem(swReloadKey);
    })
    .catch(function () {
      return undefined;
    });
})();`;

export const metadata: Metadata = {
  title: "근요일",
  description: "교내 헬스장 환경에 맞춘 학생용 운동 루틴, 잔디, 단백질 관리 서비스 MVP",
  applicationName: "근요일",
  keywords: ["근요일", "운동 루틴", "운동 기록", "단백질 관리", "PWA"],
};

export const viewport: Viewport = {
  themeColor: "#3182f6",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko">
      <body>
        <Script id="service-worker-reset" strategy="beforeInteractive">
          {serviceWorkerResetScript}
        </Script>
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
