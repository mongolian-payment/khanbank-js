# @mongolian-payment/khanbank

Khan Bank e-commerce payment SDK for Node.js — register payment orders and check their status.

[![npm version](https://img.shields.io/npm/v/@mongolian-payment/khanbank.svg)](https://www.npmjs.com/package/@mongolian-payment/khanbank)
[![license](https://img.shields.io/npm/l/@mongolian-payment/khanbank.svg)](./LICENSE)

> Part of the **[mongolian-payment](https://github.com/mongolian-payment)** SDK suite.
> Also available for Python: **[mongolian-payment-khanbank](https://pypi.org/project/mongolian-payment-khanbank/)** ([source](https://github.com/mongolian-payment/khanbank-py)).

## Requirements

- Node.js >= 18.0.0 (uses native `fetch`)

## Installation

```bash
npm install @mongolian-payment/khanbank
```

## Quick Start

```typescript
import { KhanBankClient } from "@mongolian-payment/khanbank";

const client = new KhanBankClient({
  endpoint: "https://epg.khanbank.com/payment/rest",
  username: "YOUR_USERNAME",
  password: "YOUR_PASSWORD",
  language: "mn", // optional, "mn" (default) or "en"
});

// Register a new order
const order = await client.registerOrder({
  orderNumber: "ORDER-001",
  amount: 50000,
  successCallback: "https://yourapp.com/payment/success",
  failCallback: "https://yourapp.com/payment/fail",
});

console.log(order.orderId); // Bank-assigned order ID
console.log(order.formUrl); // Redirect the user here for payment

// Check order status
const status = await client.checkOrder(order.orderId);
if (status.success) {
  console.log("Payment successful!");
} else {
  console.log(`Payment not completed: ${status.errorMessage}`);
}
```

## Configuration from Environment Variables

```typescript
import { KhanBankClient, loadConfigFromEnv } from "@mongolian-payment/khanbank";

const client = new KhanBankClient(loadConfigFromEnv());
```

| Variable             | Description                                  |
| -------------------- | -------------------------------------------- |
| `KHANBANK_ENDPOINT`  | Khan Bank API base URL                       |
| `KHANBANK_USERNAME`  | API username                                 |
| `KHANBANK_PASSWORD`  | API password                                 |
| `KHANBANK_LANGUAGE`  | Language code, `mn` or `en` (optional, `mn`) |

> Never hard-code credentials — load them from the environment or a secrets vault.

## API Reference

Credentials are sent in the request body with every call.

| Method | Description |
|--------|-------------|
| `registerOrder(input)` | Register a payment order → `{ orderId, formUrl }` |
| `checkOrder(orderId)` | Check order status → `{ success, errorCode, errorMessage, orderNumber, ip }` |

```typescript
// registerOrder takes the merchant order number, amount, and callback URLs.
// The amount is sent with fixed 2 decimal places (e.g. 50000 -> "50000.00").
const order = await client.registerOrder({
  orderNumber: "ORDER-001",
  amount: 50000,
  successCallback: "https://yourapp.com/payment/success",
  failCallback: "https://yourapp.com/payment/fail",
});

const status = await client.checkOrder(order.orderId);
console.log(status.success);      // true when the payment is completed
console.log(status.orderNumber);  // your merchant order number
console.log(status.ip);           // IP address of the payer
```

## Error Handling

All API errors throw `KhanBankError`, which includes the HTTP status code and response body:

```typescript
import { KhanBankError } from "@mongolian-payment/khanbank";

try {
  await client.checkOrder("invalid_id");
} catch (err) {
  if (err instanceof KhanBankError) {
    console.error(err.message);    // Human-readable message
    console.error(err.statusCode); // HTTP status code
    console.error(err.response);   // Raw response body
  }
}
```

## License

MIT
