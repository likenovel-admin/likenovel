export function maskEmail(email: string): string {
  const [userId, domain] = email.split("@");

  if (!domain) {
    throw new Error("Invalid email format");
  }

  let maskedUserId: string;

  if (userId.length >= 8) {
    // hide last 4 digits
    maskedUserId = userId.slice(0, -4) + "****";
  } else {
    // hide last 2 digits
    maskedUserId = userId.slice(0, -2) + "**";
  }

  return `${maskedUserId}@${domain}`;
}

// Example
// const input = {
//   "highly-positive": 1,
//   "highlypositive": 0,
//   "verypositive": 0,
//   "positive": 0,
// };

export function mergeKeysEvaluation(
  input: Record<string, number>
): Record<string, number> {
  const result: Record<string, number> = {};

  // Define mapping rules to split concatenated words
  const normalizeKey = (key: string): string => {
    let lower = key.toLowerCase().replace(/_/g, "-");
    // Handle specific known sentiment keys
    lower = lower
      .replace("highlypositive", "highly-positive")
      .replace("verypositive", "very-positive")
      .replace("somewhatpositive", "some-what-positive")
      .replace("highlynegative", "highly-negative")
      .replace("verynegative", "very-negative")
      .replace("somewhatnegative", "some-what-negative");
    return lower;
  };

  for (const [key, value] of Object.entries(input)) {
    const targetKey = normalizeKey(key);
    result[targetKey] = (result[targetKey] || 0) + value;
  }

  return result;
}

export function sumTimesEvaluation(obj: Record<string, number>): number {
  return Object.values(obj).reduce((sum, val) => sum + val, 0);
}

export function getFileName(file: File) {
  const originalName = file.name;
  const baseName =
    originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
  return `${baseName}.webp`;
}

/**
 * Normalizes a URL by ensuring it has a proper protocol
 * @param url - The URL to normalize
 * @returns The normalized URL with protocol
 * @example
 * normalizeUrl("google.com") // returns "https://google.com"
 * normalizeUrl("https://google.com") // returns "https://google.com"
 * normalizeUrl("/product/123") // returns "/product/123"
 */
export function normalizeUrl(url: string): string {
  if (!url) return url;
  // Check if URL already has protocol (http://, https://, or starts with /)
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }
  // Add https:// for external URLs
  return `https://${url}`;
}
