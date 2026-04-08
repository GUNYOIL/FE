export function sanitizePositiveIntegerInput(value: string) {
  return value.replace(/\D+/g, "");
}

export function sanitizeNonNegativeDecimalInput(value: string) {
  const sanitized = value.replace(/[^0-9.]/g, "");
  const [integerPart = "", ...decimalParts] = sanitized.split(".");

  if (decimalParts.length === 0) {
    return integerPart
  }

  return `${integerPart || "0"}.${decimalParts.join("")}`
}
