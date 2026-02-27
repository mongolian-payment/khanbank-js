import type { KhanBankConfig } from "./types.js";

/**
 * Load Khan Bank configuration from environment variables.
 *
 * Required environment variables:
 *  - KHANBANK_ENDPOINT - Khan Bank API base URL
 *  - KHANBANK_USERNAME - API username
 *  - KHANBANK_PASSWORD - API password
 *
 * Optional environment variables:
 *  - KHANBANK_LANGUAGE - Language code (defaults to "mn")
 *
 * @throws {Error} if any required variable is missing.
 */
export function loadConfigFromEnv(): KhanBankConfig {
  const endpoint = process.env.KHANBANK_ENDPOINT;
  const username = process.env.KHANBANK_USERNAME;
  const password = process.env.KHANBANK_PASSWORD;
  const language = process.env.KHANBANK_LANGUAGE;

  if (!endpoint) {
    throw new Error("Missing environment variable: KHANBANK_ENDPOINT");
  }
  if (!username) {
    throw new Error("Missing environment variable: KHANBANK_USERNAME");
  }
  if (!password) {
    throw new Error("Missing environment variable: KHANBANK_PASSWORD");
  }

  return {
    endpoint,
    username,
    password,
    ...(language ? { language } : {}),
  };
}
