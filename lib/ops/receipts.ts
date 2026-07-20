// Shared receipt-upload rules. Safe to import from both server routes and
// client components (no server-only imports here).

// Images (incl. iPhone HEIC/HEIF from the phone-capture flow) plus PDF.
export const RECEIPT_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "heic", "heif", "pdf"];
export const RECEIPT_MAX_SIZE = 25 * 1024 * 1024; // 25MB

export function receiptExtensionOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i === -1 ? "" : filename.slice(i + 1).toLowerCase();
}

export function isAllowedReceipt(filename: string): boolean {
  return RECEIPT_EXTENSIONS.includes(receiptExtensionOf(filename));
}

export function safeReceiptName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned.slice(-180) || "receipt";
}

export const RECEIPT_ACCEPT = RECEIPT_EXTENSIONS.map((e) => `.${e}`).join(",");
