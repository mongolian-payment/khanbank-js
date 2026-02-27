# @mongolian-payment/khanbank

Khan Bank payment SDK for Node.js. Register payment orders and check their status using the Khan Bank e-commerce gateway.

## Installation

```bash
npm install @mongolian-payment/khanbank
```

## Quick Start

```typescript
import { KhanBankClient } from '@mongolian-payment/khanbank';

const client = new KhanBankClient({
  endpoint: 'https://epg.khanbank.com/payment/rest',
  username: 'your-username',
  password: 'your-password',
  language: 'mn', // optional, defaults to 'mn'
});

// Register a new order
const order = await client.registerOrder({
  orderNumber: 'ORDER-001',
  amount: 50000,
  successCallback: 'https://yoursite.com/payment/success',
  failCallback: 'https://yoursite.com/payment/fail',
});

console.log(order.orderId);  // Bank-assigned order ID
console.log(order.formUrl);  // Redirect user here for payment

// Check order status
const status = await client.checkOrder(order.orderId);

if (status.success) {
  console.log('Payment successful!');
} else {
  console.log(`Payment failed: ${status.errorMessage}`);
}
```

## Configuration

### Direct Configuration

```typescript
const client = new KhanBankClient({
  endpoint: 'https://epg.khanbank.com/payment/rest',
  username: 'your-username',
  password: 'your-password',
  language: 'en', // 'mn' (Mongolian) or 'en' (English)
});
```

### Environment Variables

```typescript
import { loadConfigFromEnv } from '@mongolian-payment/khanbank';

// Reads from:
//   KHANBANK_ENDPOINT (required)
//   KHANBANK_USERNAME (required)
//   KHANBANK_PASSWORD (required)
//   KHANBANK_LANGUAGE (optional, defaults to 'mn')
const config = loadConfigFromEnv();
const client = new KhanBankClient(config);
```

## API Reference

### `new KhanBankClient(config)`

Create a new client instance.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endpoint` | `string` | Yes | Khan Bank API base URL |
| `username` | `string` | Yes | API username |
| `password` | `string` | Yes | API password |
| `language` | `string` | No | Language code (`'mn'` or `'en'`, defaults to `'mn'`) |

### `client.registerOrder(input)`

Register a new payment order.

| Parameter | Type | Description |
|-----------|------|-------------|
| `orderNumber` | `string` | Your merchant order number |
| `amount` | `number` | Payment amount (formatted as fixed 2 decimal places) |
| `successCallback` | `string` | URL to redirect on successful payment |
| `failCallback` | `string` | URL to redirect on failed payment |

Returns `Promise<RegisterOrderResponse>`:
- `orderId` - Bank-assigned order ID
- `formUrl` - Payment form URL (redirect the user here)

### `client.checkOrder(orderId)`

Check the status of an existing order.

| Parameter | Type | Description |
|-----------|------|-------------|
| `orderId` | `string` | The bank-assigned order ID |

Returns `Promise<OrderStatusResponse>`:
- `success` - `true` if the payment was successful
- `errorCode` - Error code from the bank
- `errorMessage` - Error message from the bank
- `orderNumber` - Your merchant order number
- `ip` - IP address of the payer

## Error Handling

All API errors throw a `KhanBankError`:

```typescript
import { KhanBankClient, KhanBankError } from '@mongolian-payment/khanbank';

try {
  const order = await client.registerOrder({ ... });
} catch (err) {
  if (err instanceof KhanBankError) {
    console.error(err.message);     // Error description
    console.error(err.statusCode);  // HTTP status code
    console.error(err.response);    // Raw API response
  }
}
```

## Requirements

- Node.js >= 18.0.0 (uses native `fetch`)

## License

MIT
