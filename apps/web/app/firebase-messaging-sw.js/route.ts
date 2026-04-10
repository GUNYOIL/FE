import { NextResponse } from "next/server"

const JAVASCRIPT_CONTENT_TYPE = "application/javascript; charset=utf-8"

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

function buildServiceWorkerSource() {
  const config = readFirebaseServiceWorkerConfig()

  if (!config) {
    return "self.addEventListener('install', () => self.skipWaiting()); self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));"
  }

  return `
importScripts("https://www.gstatic.com/firebasejs/11.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(config)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "근요일 알림";
  const body = payload.notification?.body || "";
  const link = payload.fcmOptions?.link || payload.data?.link || "/";

  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.svg",
    badge: "/icon-192.svg",
    data: { link },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification?.data?.link || "/";

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
