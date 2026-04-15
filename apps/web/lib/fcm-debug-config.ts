export function isFcmDebugEnabledOnServer() {
  return process.env.NODE_ENV !== "production" || process.env.VERCEL_GIT_COMMIT_REF === "develop"
}
