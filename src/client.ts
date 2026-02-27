import type {
  KhanBankConfig,
  OrderRegisterInput,
  RegisterOrderResponse,
  OrderStatusResponse,
  OrderRegisterRequest,
  RegisterOrderResponseWire,
  OrderStatusRequest,
  OrderStatusResponseWire,
} from "./types.js";
import { MONGOLIAN_LANGUAGE_CODE } from "./types.js";
import { KhanBankError } from "./errors.js";

/**
 * Khan Bank payment client.
 *
 * Handles order registration and payment status checks.
 * Credentials (username/password) are sent in the request body with every call.
 */
export class KhanBankClient {
  private readonly endpoint: string;
  private readonly username: string;
  private readonly password: string;
  private readonly language: string;

  constructor(config: KhanBankConfig) {
    if (!config.endpoint) {
      throw new Error("KhanBankClient: endpoint is required");
    }
    if (!config.username) {
      throw new Error("KhanBankClient: username is required");
    }
    if (!config.password) {
      throw new Error("KhanBankClient: password is required");
    }

    // Strip trailing slash for consistent URL building
    this.endpoint = config.endpoint.replace(/\/+$/, "");
    this.username = config.username;
    this.password = config.password;
    this.language = config.language ?? MONGOLIAN_LANGUAGE_CODE;
  }

  // ── Public API ──

  /**
   * Register a new payment order with Khan Bank.
   *
   * The amount is formatted as a fixed 2-decimal-place string (e.g. 1000 -> "1000.00").
   * Returns the bank-assigned order ID and a payment form URL to redirect the user to.
   */
  async registerOrder(
    input: OrderRegisterInput
  ): Promise<RegisterOrderResponse> {
    const body: OrderRegisterRequest = {
      orderNumber: input.orderNumber,
      amount: input.amount.toFixed(2),
      returnUrl: input.successCallback,
      failUrl: input.failCallback,
      jsonParams: { orderNumber: input.orderNumber },
      userName: this.username,
      Password: this.password,
      language: this.language,
    };

    const raw = await this.post<RegisterOrderResponseWire>(
      "/register.do",
      body
    );

    return {
      orderId: raw.orderId ?? "",
      formUrl: raw.formUrl ?? "",
    };
  }

  /**
   * Check the status of an existing order.
   *
   * Returns a parsed response with a `success` boolean (`true` when orderStatus is "2").
   */
  async checkOrder(orderId: string): Promise<OrderStatusResponse> {
    const body: OrderStatusRequest = {
      userName: this.username,
      Password: this.password,
      language: this.language,
      orderId,
    };

    const raw = await this.post<OrderStatusResponseWire>(
      "/getOrderStatus.do",
      body
    );

    return {
      success: raw.orderStatus === "2",
      errorCode: raw.ErrorCode ?? "",
      errorMessage: raw.ErrorMessage ?? "",
      orderNumber: raw.OrderNumber ?? "",
      ip: raw.Ip ?? "",
    };
  }

  // ── Private helpers ──

  /**
   * Send a POST request to the Khan Bank API.
   */
  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.endpoint}${path}`;

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new KhanBankError(
        `Network error calling ${path}: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      throw new KhanBankError(
        `Invalid JSON response from ${path}`,
        res.status
      );
    }

    if (!res.ok) {
      throw new KhanBankError(
        `Khan Bank API error: HTTP ${res.status}`,
        res.status,
        json
      );
    }

    return json as T;
  }
}
