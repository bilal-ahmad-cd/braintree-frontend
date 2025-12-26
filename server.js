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
                createdAt: sub.createdAt,
                addOns: sub.addOns || [],
                discounts: sub.discounts || []
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

app.listen(PORT, () => {
    console.log(`\n🚀 Braintree Server running at http://localhost:${PORT}`);
    console.log(`\n📍 Available endpoints:`);
    console.log(`   GET  /api/config - Get configuration`);
    console.log(`   GET  /api/client-token?customerId=xxx - Generate client token`);
    console.log(`   GET  /api/customer/:id - Get customer details`);
    console.log(`   GET  /api/customer/:id/transactions - Get customer transactions`);
    console.log(`   GET  /api/customer/:id/subscriptions - Get customer subscriptions`);
    console.log(`   POST /api/refund/:transactionId - Refund transaction\n`);
});
