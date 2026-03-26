export function sanitizePositiveIntegerInput(value: string) {
  return value.replace(/\D+/g, "");
}
