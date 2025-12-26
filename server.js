require('dotenv').config();
const express = require('express');
const braintree = require('braintree');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Braintree gateway
const gateway = new braintree.BraintreeGateway({
    environment: process.env.BRAINTREE_ENVIRONMENT === 'production'
        ? braintree.Environment.Production
        : braintree.Environment.Sandbox,
    merchantId: process.env.BRAINTREE_MERCHANT_ID,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Endpoint to get configuration
app.get('/api/config', (req, res) => {
    res.json({
        customerId: process.env.CUSTOMER_ID
    });
});

// Endpoint to test Braintree connection
app.get('/api/test-connection', async (req, res) => {
    try {
        console.log('Testing Braintree connection...');
        console.log('Environment:', process.env.BRAINTREE_ENVIRONMENT);
        console.log('Merchant ID:', process.env.BRAINTREE_MERCHANT_ID);
        console.log('Public Key:', process.env.BRAINTREE_PUBLIC_KEY?.substring(0, 8) + '...');

        const response = await gateway.clientToken.generate({});
        res.json({
            success: true,
            message: 'Braintree connection successful',
            environment: process.env.BRAINTREE_ENVIRONMENT
        });
    } catch (error) {
        console.error('Connection test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            type: error.type,
            details: 'Please verify your Braintree credentials in .env file'
        });
    }
});

// Endpoint to generate client token (optional: for specific customer)
app.get('/api/client-token', async (req, res) => {
    try {
        const customerId = req.query.customerId;
        const options = {};

        if (customerId) {
            options.customerId = customerId;
        }

        const response = await gateway.clientToken.generate(options);
        res.json({ clientToken: response.clientToken });
    } catch (error) {
        console.error('Error generating client token:', error);
        res.status(500).json({ error: 'Failed to generate client token' });
    }
});

// Endpoint to process payment
app.post('/api/checkout', async (req, res) => {
    try {
        const { paymentMethodNonce, amount, deviceData } = req.body;

        if (!paymentMethodNonce || !amount) {
            return res.status(400).json({
                error: 'Payment method nonce and amount are required'
            });
        }

        const result = await gateway.transaction.sale({
            amount: amount,
            paymentMethodNonce: paymentMethodNonce,
            deviceData: deviceData,
            options: {
                submitForSettlement: true
            }
        });

        if (result.success) {
            res.json({
                success: true,
                transaction: {
                    id: result.transaction.id,
                    status: result.transaction.status,
                    amount: result.transaction.amount,
                    createdAt: result.transaction.createdAt
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.message,
                errors: result.errors
            });
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process payment'
        });
    }
});

// Endpoint to get transaction details
app.get('/api/transaction/:id', async (req, res) => {
    try {
        const transaction = await gateway.transaction.find(req.params.id);
        res.json({
            success: true,
            transaction: {
                id: transaction.id,
                status: transaction.status,
                type: transaction.type,
                amount: transaction.amount,
                createdAt: transaction.createdAt,
                updatedAt: transaction.updatedAt,
                creditCard: transaction.creditCard ? {
                    cardType: transaction.creditCard.cardType,
                    last4: transaction.creditCard.last4,
                    expirationMonth: transaction.creditCard.expirationMonth,
                    expirationYear: transaction.creditCard.expirationYear
                } : null
            }
        });
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(404).json({
            success: false,
            error: 'Transaction not found'
        });
    }
});

// Endpoint to list all customers
app.get('/api/customers', async (req, res) => {
    try {
        const stream = gateway.customer.search((search) => {
            // Return all customers (no filters)
        });

        const customers = [];

        stream.on('data', (customer) => {
            customers.push({
                id: customer.id,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                createdAt: customer.createdAt
            });
        });

        stream.on('end', () => {
            res.json({
                success: true,
                customers: customers,
                count: customers.length
            });
        });

        stream.on('error', (error) => {
            console.error('Error listing customers:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to list customers'
            });
        });
    } catch (error) {
        console.error('Error listing customers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list customers'
        });
    }
});

// Endpoint to create a customer
app.post('/api/customer', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, paymentMethodNonce } = req.body;

        const customerData = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: phone
        };

        if (paymentMethodNonce) {
            customerData.paymentMethodNonce = paymentMethodNonce;
        }

        const result = await gateway.customer.create(customerData);

        if (result.success) {
            res.json({
                success: true,
                customer: {
                    id: result.customer.id,
                    firstName: result.customer.firstName,
                    lastName: result.customer.lastName,
                    email: result.customer.email,
                    createdAt: result.customer.createdAt
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.message,
                errors: result.errors
            });
        }
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create customer'
        });
    }
});

// Endpoint to get customer details
app.get('/api/customer/:id', async (req, res) => {
    try {
        const customer = await gateway.customer.find(req.params.id);
        res.json({
            success: true,
            customer: {
                id: customer.id,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                createdAt: customer.createdAt,
                paymentMethods: customer.paymentMethods
            }
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(404).json({
            success: false,
            error: 'Customer not found'
        });
    }
});

// Endpoint to get customer transactions
app.get('/api/customer/:id/transactions', async (req, res) => {
    try {
        const customerId = req.params.id;

        const stream = gateway.transaction.search((search) => {
            search.customerId().is(customerId);
        });

        const transactions = [];

        stream.on('data', (transaction) => {
            transactions.push({
                id: transaction.id,
                amount: transaction.amount,
                status: transaction.status,
                type: transaction.type,
                createdAt: transaction.createdAt,
                updatedAt: transaction.updatedAt,
                cardType: transaction.creditCard ? transaction.creditCard.cardType : null,
                last4: transaction.creditCard ? transaction.creditCard.last4 : null
            });
        });

        stream.on('end', () => {
            // Sort by date descending (most recent first)
            transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            res.json({
                success: true,
                transactions: transactions,
                count: transactions.length
            });
        });

        stream.on('error', (error) => {
            console.error('Error fetching transactions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch transactions'
            });
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transactions'
        });
    }
});

// Endpoint to get customer subscriptions
app.get('/api/customer/:id/subscriptions', async (req, res) => {
    try {
        const customerId = req.params.id;

        // Get customer to access payment methods
        const customer = await gateway.customer.find(customerId);

        if (!customer.paymentMethods || customer.paymentMethods.length === 0) {
            return res.json({
                success: true,
                subscriptions: [],
                count: 0
            });
        }

        // Search for subscriptions across all payment methods
        const allSubscriptions = [];

        for (const paymentMethod of customer.paymentMethods) {
            if (paymentMethod.subscriptions) {
                allSubscriptions.push(...paymentMethod.subscriptions);
            }
        }

        res.json({
            success: true,
            subscriptions: allSubscriptions.map(sub => ({
                id: sub.id,
                status: sub.status,
                planId: sub.planId,
                price: sub.price,
                nextBillingDate: sub.nextBillingDate,
                createdAt: sub.createdAt
            })),
            count: allSubscriptions.length
        });
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch subscriptions'
        });
    }
});

// Endpoint to refund a transaction
app.post('/api/refund/:transactionId', async (req, res) => {
    try {
        const { amount } = req.body;
        const transactionId = req.params.transactionId;

        let result;
        if (amount) {
            result = await gateway.transaction.refund(transactionId, amount);
        } else {
            result = await gateway.transaction.refund(transactionId);
        }

        if (result.success) {
            res.json({
                success: true,
                transaction: {
                    id: result.transaction.id,
                    status: result.transaction.status,
                    amount: result.transaction.amount
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.message,
                errors: result.errors
            });
        }
    } catch (error) {
        console.error('Error processing refund:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process refund'
        });
    }
});

// Endpoint to void a transaction
app.post('/api/void/:transactionId', async (req, res) => {
    try {
        const result = await gateway.transaction.void(req.params.transactionId);

        if (result.success) {
            res.json({
                success: true,
                transaction: {
                    id: result.transaction.id,
                    status: result.transaction.status
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.message,
                errors: result.errors
            });
        }
    } catch (error) {
        console.error('Error voiding transaction:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to void transaction'
        });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Braintree Server running at http://localhost:${PORT}`);
    console.log(`\n📍 Available endpoints:`);
    console.log(`   GET  /api/test-connection - Test Braintree connection`);
    console.log(`   GET  /api/client-token?customerId=xxx - Generate client token (optional customer)`);
    console.log(`   POST /api/checkout - Process payment`);
    console.log(`   GET  /api/transaction/:id - Get transaction details`);
    console.log(`   GET  /api/customers - List all customers`);
    console.log(`   POST /api/customer - Create customer`);
    console.log(`   GET  /api/customer/:id - Get customer details`);
    console.log(`   GET  /api/customer/:id/transactions - Get customer transactions`);
    console.log(`   GET  /api/customer/:id/subscriptions - Get customer subscriptions`);
    console.log(`   POST /api/refund/:transactionId - Refund transaction`);
    console.log(`   POST /api/void/:transactionId - Void transaction\n`);
});
