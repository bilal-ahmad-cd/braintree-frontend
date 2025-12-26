# Braintree Nonce Generator

A streamlined Braintree integration for generating vaulted payment nonces and viewing customer subscription data in sandbox mode.

## Features

- 💳 **Vaulted Nonce Generation** - Generate payment nonces tied to a specific customer for subscription creation
- 📊 **Tabbed Customer View** - Display customer information across three tabs:
  - **Active Subscriptions** - Shows subscription pricing with add-ons and discounts breakdown
  - **Transaction History** - Visual indicators (color-coded icons with arrows) to distinguish credits from sales
  - **Payment Methods** - View all vaulted payment methods
- 💰 **Refund Transactions** - Refund eligible transactions directly from the UI
- 🎨 **Clean Flat Design** - Full-page layout with minimal shadows and simple styling

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
CUSTOMER_ID=your_customer_id
```

**Note:** The `CUSTOMER_ID` is the Braintree customer whose data will be displayed. This customer ID is loaded dynamically from the backend.

4. Start the server:
```bash
npm start
```

5. Open your browser to `http://localhost:3010`

## Project Structure

```
braintree-frontend/
├── public/
│   └── index.html          # Main nonce generator and customer view
├── server.js               # Express server with Braintree API
├── package.json
├── .env                    # Environment variables (create this)
└── .gitignore
```

## API Endpoints

All endpoints are available at `http://localhost:3010`

### Configuration
- `GET /api/config` - Get configuration (returns customer ID from .env)

### Client Token
- `GET /api/client-token?customerId=xxx` - Generate client token for Drop-in UI (optional customer ID)

### Customer Data
- `GET /api/customer/:id` - Get customer details including payment methods
- `GET /api/customer/:id/transactions` - Get all customer transactions (sorted by date, descending)
- `GET /api/customer/:id/subscriptions` - Get customer subscriptions with add-ons and discounts

### Transactions
- `POST /api/refund/:transactionId` - Refund a transaction (full refund only)

## Test Cards (Sandbox)

- **Visa:** 4111 1111 1111 1111
- **Mastercard:** 5555 5555 5555 4444
- **Amex:** 3782 822463 10005
- **CVV:** Any 3-4 digits
- **Expiry:** Any future date

## Usage

### Generate Vaulted Nonce for Subscriptions

1. Open `http://localhost:3010` in your browser
2. Customer information loads automatically from the configured `CUSTOMER_ID`
3. View customer data in the tabbed interface:
   - **Active Subscriptions** - See subscription pricing with add-ons breakdown
   - **Transactions** - View transaction history with visual credit/sale indicators
   - **Payment Methods** - See all vaulted payment methods
4. Enter test card details in the Braintree Drop-in UI
5. Click "Generate Nonce" to create a vaulted payment nonce
6. The nonce is displayed and can be copied for use in subscription API calls

### Refund a Transaction

1. Navigate to the **Transactions** tab
2. Find a transaction with status `settled` or `submitted_for_settlement`
3. Click the red "Refund Transaction" button
4. Confirm the refund
5. The transaction list will refresh automatically

### Understanding Transaction Types

Transactions are visually distinguished by color-coded icons:
- **Green (↑) CREDIT** - Money coming in (refunds, credits) - displayed as `+$amount`
- **Red (↓) SALE** - Money going out (charges, sales) - displayed as `-$amount`

## Making Common Edits

### Change the Customer ID

1. Open the `.env` file
2. Update the `CUSTOMER_ID` value to your desired Braintree customer ID
3. Restart the server with `npm start`
4. The new customer's data will load automatically

### Modify UI Colors or Styling

All styles are in `public/index.html` within the `<style>` tag (lines 8-249):
- **Primary color:** Change `#007bff` to your preferred color
- **Background:** Body background is `#f5f5f5`, container is `white`
- **Credit/Sale colors:** Green `#28a745` for credits, Red `#dc3545` for sales
- **Design philosophy:** Flat design with minimal shadows, 2px border-radius, simple borders

### Add New API Endpoints

1. Open `server.js`
2. Add your endpoint following the existing pattern:
   ```javascript
   app.get('/api/your-endpoint', async (req, res) => {
       try {
           // Your Braintree API call
           const result = await gateway.something.method();
           res.json({ success: true, data: result });
       } catch (error) {
           console.error('Error:', error);
           res.status(500).json({ success: false, error: 'Error message' });
       }
   });
   ```
3. Update the server startup logs (lines 212-220) to include your new endpoint

### Modify Transaction Display

Transaction rendering is in `public/index.html` at the `loadTransactions()` function (lines 365-422):
- **Transaction cards:** Lines 386-413 contain the HTML structure
- **Visual indicators:** Lines 376-383 define colors, icons, and labels
- **Refund button logic:** Line 375 determines which transactions show refund buttons

### Customize Subscription Display

Subscription pricing and add-ons display is in `public/index.html` at lines 517-587:
- **Price calculation:** Lines 519-537 compute total with add-ons and discounts
- **Add-ons HTML:** Lines 539-551 render the add-ons list
- **Discounts HTML:** Lines 553-562 render discounts
- **Price breakdown:** Lines 564-568 show the formula

### Change Port Number

1. Update `PORT=3010` in the `.env` file
2. Update all `fetch()` calls in `public/index.html` from `http://localhost:3010` to your new port
3. Restart the server

## Technologies Used

- **Backend:** Node.js, Express.js
- **Payment Gateway:** Braintree SDK (v3.35.0)
- **Frontend:** Vanilla JavaScript, Braintree Drop-in UI
- **Environment:** dotenv

## License

MIT

## Author

Built with Braintree Payments API
