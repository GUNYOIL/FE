"use client"

import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app"

type FirebaseWebConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

function readFirebaseWebConfig(): FirebaseWebConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

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
    measurementId,
  }
}

export function isFirebaseMessagingConfigured() {
  return Boolean(readFirebaseWebConfig() && process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY)
}

export function getFirebaseWebConfig() {
  return readFirebaseWebConfig()
}

export function getFirebaseApp() {
  const firebaseConfig = readFirebaseWebConfig()

  if (!firebaseConfig) {
    throw new Error("Firebase Web 설정이 없습니다.")
  }

  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}
