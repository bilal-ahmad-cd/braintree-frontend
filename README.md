# Braintree Nonce Generator

A simple Braintree integration for generating payment nonces and managing customer subscriptions in sandbox mode.

## Features

- 💳 **Payment Nonce Generation** - Generate vaulted payment nonces for testing subscriptions
- 👥 **Customer Management** - View and manage customers with pagination
- 📊 **Tabbed Interface** - Organized display of:
  - Active Subscriptions
  - Transaction History
  - Payment Methods
- 🔄 **Comprehensive API** - RESTful endpoints for all Braintree operations

## Prerequisites

- Node.js (v14 or higher)
- Braintree Sandbox Account

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd braintree-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
BRAINTREE_ENVIRONMENT=sandbox
BRAINTREE_MERCHANT_ID=your_merchant_id
BRAINTREE_PUBLIC_KEY=your_public_key
BRAINTREE_PRIVATE_KEY=your_private_key
PORT=3010
```

4. Start the server:
```bash
npm start
```

5. Open your browser to `http://localhost:3010`

## Project Structure

```
braintree-frontend/
├── public/
│   ├── index.html          # Main nonce generator page
│   └── customers.html      # Customer management page
├── server.js               # Express server with Braintree API
├── package.json
└── .env                    # Environment variables (create this)
```

## API Endpoints

### Client Token
- `GET /api/client-token?customerId=xxx` - Generate client token (optional customer)

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customer` - Create customer
- `GET /api/customer/:id` - Get customer details
- `GET /api/customer/:id/transactions` - Get customer transactions
- `GET /api/customer/:id/subscriptions` - Get customer subscriptions

### Transactions
- `POST /api/checkout` - Process payment
- `GET /api/transaction/:id` - Get transaction details
- `POST /api/refund/:transactionId` - Refund transaction
- `POST /api/void/:transactionId` - Void transaction

### Testing
- `GET /api/test-connection` - Test Braintree connection

## Test Cards (Sandbox)

- **Visa:** 4111 1111 1111 1111
- **Mastercard:** 5555 5555 5555 4444
- **Amex:** 3782 822463 10005
- **CVV:** Any 3-4 digits
- **Expiry:** Any future date

## Usage

### Generate Nonce for Subscriptions

1. Go to `http://localhost:3010`
2. Customer information will load automatically
3. Enter test card details
4. Click "Generate Nonce"
5. The nonce is vaulted and ready for subscription creation

### View All Customers

1. Go to `http://localhost:3010/customers.html`
2. Browse customers with pagination
3. Click "Generate Nonce" on any customer to create a vaulted nonce

## Technologies Used

- **Backend:** Node.js, Express.js
- **Payment Gateway:** Braintree SDK (v3.35.0)
- **Frontend:** Vanilla JavaScript, Braintree Drop-in UI
- **Environment:** dotenv

## License

MIT

## Author

Built with Braintree Payments API
