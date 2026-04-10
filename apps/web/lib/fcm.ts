"use client"

import { deleteToken, getMessaging, getToken, isSupported, MessagePayload, onMessage } from "firebase/messaging"
import { getFirebaseApp, isFirebaseMessagingConfigured } from "@/lib/firebase"

const FCM_SERVICE_WORKER_PATH = "/firebase-messaging-sw.js"
const FCM_SERVICE_WORKER_SCOPE = "/firebase-cloud-messaging-push-scope"

export function isPushMessagingSupported() {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator
}

export function getNotificationPermissionStatus() {
  if (!isPushMessagingSupported()) {
    return "unsupported"
  }

  return Notification.permission
}

async function getMessagingIfSupported() {
  if (!isFirebaseMessagingConfigured() || !isPushMessagingSupported()) {
    return null
  }

  if (!(await isSupported())) {
    return null
  }

  return getMessaging(getFirebaseApp())
}

export async function requestNotificationPermission() {
  if (!isPushMessagingSupported()) {
    return "unsupported" as const
  }

  return Notification.requestPermission()
}

export async function registerMessagingServiceWorker() {
  if (!isPushMessagingSupported()) {
    return null
  }

  return navigator.serviceWorker.register(FCM_SERVICE_WORKER_PATH, {
    scope: FCM_SERVICE_WORKER_SCOPE,
    updateViaCache: "none",
  })
}

export async function getFcmRegistrationToken() {
  if (!isFirebaseMessagingConfigured()) {
    return null
  }

  const permission = await requestNotificationPermission()
  if (permission !== "granted") {
    return null
  }

  const messaging = await getMessagingIfSupported()
  if (!messaging) {
    return null
  }

  const registration = await registerMessagingServiceWorker()
  if (!registration) {
    return null
  }

  return getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  })
}

export async function deleteBrowserFcmToken() {
  const messaging = await getMessagingIfSupported()
  if (!messaging) {
    return false
  }

  return deleteToken(messaging)
}

export async function listenForegroundMessages(handler: (payload: MessagePayload) => void) {
  const messaging = await getMessagingIfSupported()
  if (!messaging) {
    return () => {}
  }

  return onMessage(messaging, handler)
}
