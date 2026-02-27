/**
 * Custom error class for Khan Bank API errors.
 *
 * Includes the HTTP status code and raw response body when available.
 */
export class KhanBankError extends Error {
  public readonly statusCode?: number;
  public readonly response?: unknown;

  constructor(message: string, statusCode?: number, response?: unknown) {
    super(message);
    this.name = "KhanBankError";
    this.statusCode = statusCode;
    this.response = response;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
