// ============================================================================
// Constants
// ============================================================================

export const MONGOLIAN_LANGUAGE_CODE = "mn";
export const ENGLISH_LANGUAGE_CODE = "en";

// ============================================================================
// Configuration
// ============================================================================

/** Configuration for the KhanBankClient */
export interface KhanBankConfig {
  /** Khan Bank API base endpoint */
  endpoint: string;
  /** API username */
  username: string;
  /** API password */
  password: string;
  /** Language code (defaults to "mn") */
  language?: string;
}

// ============================================================================
// SDK Input/Output Types (user-facing)
// ============================================================================

/** Input for registering a new order */
export interface OrderRegisterInput {
  /** Merchant order number */
  orderNumber: string;
  /** Payment amount (will be formatted as fixed 2 decimal places) */
  amount: number;
  /** URL to redirect on successful payment */
  successCallback: string;
  /** URL to redirect on failed payment */
  failCallback: string;
}

/** Response from registering an order */
export interface RegisterOrderResponse {
  /** Order ID assigned by the bank */
  orderId: string;
  /** URL of the payment form to redirect the user to */
  formUrl: string;
}

/** Parsed response from checking order status */
export interface OrderStatusResponse {
  /** Whether the payment was successful (orderStatus === "2") */
  success: boolean;
  /** Error code from the bank */
  errorCode: string;
  /** Error message from the bank */
  errorMessage: string;
  /** Merchant order number */
  orderNumber: string;
  /** IP address of the payer */
  ip: string;
}

// ============================================================================
// Wire Format Types (matching Khan Bank API JSON exactly)
// ============================================================================

/** @internal Credentials embedded in every request */
export interface KhaanRequestBody {
  userName: string;
  Password: string;
  language: string;
}

/** @internal Register order request sent to the API */
export interface OrderRegisterRequest extends KhaanRequestBody {
  orderNumber: string;
  amount: string;
  returnUrl: string;
  failUrl: string;
  jsonParams: Record<string, string>;
}

/** @internal Raw register order response from the API */
export interface RegisterOrderResponseWire {
  orderId: string;
  formUrl: string;
}

/** @internal Order status request sent to the API */
export interface OrderStatusRequest extends KhaanRequestBody {
  orderId: string;
}

/** @internal Raw order status response from the API */
export interface OrderStatusResponseWire {
  orderStatus: string;
  ErrorCode: string;
  ErrorMessage: string;
  OrderNumber: string;
  Ip: string;
}
