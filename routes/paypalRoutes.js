const express = require('express');
const router = express.Router();
const { createOrder, captureOrder } = require('../services/paypal');

// Route to create an order
router.post('/create-order', async (req, res) => {
    const { amount, currency } = req.body; // Dynamic values from frontend

    try {
        const order = await createOrder(amount, currency);
        res.status(201).json(order);
    } catch (error) {
        console.error('Error in /create-order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Route to capture an order
router.post('/capture-order/:orderID', async (req, res) => {
    const { orderID } = req.params;

    try {
        const capture = await captureOrder(orderID);
        res.json(capture); // Send capture result back to frontend
    } catch (error) {
        console.error('Error in /capture-order:', error);
        res.status(500).json({ error: 'Failed to capture order' });
    }
});

module.exports = router;
