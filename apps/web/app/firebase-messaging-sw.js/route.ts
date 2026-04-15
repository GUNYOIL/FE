import { NextResponse } from "next/server"
import { isFcmDebugEnabledOnServer } from "@/lib/fcm-debug-config"

const JAVASCRIPT_CONTENT_TYPE = "application/javascript; charset=utf-8"
const FCM_DEBUG_MESSAGE_TYPE = "gunyoil:fcm-debug-log"

function readFirebaseServiceWorkerConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    return null
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  }
}

function buildServiceWorkerDebugSource() {
  return `
const FCM_DEBUG_MESSAGE_TYPE = ${JSON.stringify(FCM_DEBUG_MESSAGE_TYPE)};
const FCM_DEBUG_ENABLED = ${JSON.stringify(isFcmDebugEnabledOnServer())};

function broadcastFcmDebug(entry) {
  if (!FCM_DEBUG_ENABLED) {
    return;
  }

  self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      client.postMessage({
        type: FCM_DEBUG_MESSAGE_TYPE,
        entry,
      });
    }
  }).catch(() => undefined);
}

function logFcm(event, details = {}) {
  const payload = {
    at: new Date().toISOString(),
    epoch_ms: Date.now(),
    perf_ms: Number(performance.now().toFixed(1)),
    ...details,
  };

  console.info("[FCM][SW]", event, payload);
  broadcastFcmDebug({
    prefix: "[FCM][SW]",
    event,
    details: payload,
    source: "service_worker",
  });
}
`
}

function buildServiceWorkerSource() {
  const config = readFirebaseServiceWorkerConfig()
  const debugSource = buildServiceWorkerDebugSource()

  if (!config) {
    return `
${debugSource}
self.addEventListener("install", () => {
  logFcm("lifecycle.install");
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  logFcm("lifecycle.activate");
  event.waitUntil(self.clients.claim());
});
`
  }

  return `
${debugSource}
importScripts("https://www.gstatic.com/firebasejs/11.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(config)});
logFcm("firebase.initialized", {
  projectId: ${JSON.stringify(config.projectId)},
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "근요일 알림";
  const body = payload.notification?.body || "";
  const link = payload.fcmOptions?.link || payload.data?.link || "/";
  const messageId = payload.messageId || null;

  logFcm("background.onBackgroundMessage", {
    message_id: messageId,
    title,
    body_length: body.length,
    link,
  });

  logFcm("background.showNotification_before", {
    message_id: messageId,
    title,
    link,
  });

  Promise.resolve(self.registration.showNotification(title, {
    body,
    icon: "/icon-192.svg",
    badge: "/icon-192.svg",
    data: { link },
  })).then(() => {
    logFcm("background.showNotification_after", {
      message_id: messageId,
      title,
      link,
    });
  }).catch((error) => {
    logFcm("background.showNotification_error", {
      message_id: messageId,
      error_name: error?.name || null,
      error_message: error?.message || String(error),
    });
  });
});

self.addEventListener("install", () => {
  logFcm("lifecycle.install");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  logFcm("lifecycle.activate", {
    scope: self.registration?.scope || null,
  });
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification?.data?.link || "/";

  logFcm("notification.click", {
    link,
    title: event.notification?.title || null,
  });

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(link);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(link);
      }

      return undefined;
    }),
  );
});
`
}

export async function GET() {
  return new NextResponse(buildServiceWorkerSource(), {
    headers: {
      "Content-Type": JAVASCRIPT_CONTENT_TYPE,
      "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
    },
  })
}
