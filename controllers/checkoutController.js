const Order = require('../models/order');
const OrderItem = require('../models/orderItem');
const User = require('../models/user');
const Product = require('../models/product');
const { sendOrderConfirmationEmail } = require('../services/emailService');

const CheckoutController = {
    checkout: async (req, res) => {
        const userId = req.session.userId; 
        const cart = req.session.cart || [];

        if (!cart.length) {
            return res.status(400).json({ message: 'Cart is empty.' });
        }

        // Calculate total price
        const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);

        try {
            // Create order
            const orderId = await Order.create(userId, totalPrice);

            // Create order items and update stock quantity
            for (const item of cart) {
                // Create order item
                await OrderItem.create(orderId, item.productId, item.quantity);
                const product = await Product.findById(item.productId);

                // Update stock quantity
                console.log('Current Stock Quan: ', product.stock_quantity);
                console.log('item Bought: ', item.quantity);
                const newStockQuantity = product.stock_quantity - item.quantity;
                await Product.updateStock(item.productId, newStockQuantity);
            }

            // Get user email
            const user = await User.findById(userId);

            // Send confirmation email
            await sendOrderConfirmationEmail(user.email, orderId, cart, totalPrice);

            // Clear the cart after successful checkout
            req.session.cart = [];
            return res.redirect('/thankyou'); 
        } catch (error) {
            console.error('Checkout error:', error);
            res.status(500).json({ message: 'Error processing checkout.', error: error.message });
        }
    },
    
    renderCheckout: async (req, res) => {
        const userId = req.session.userId;
        const user = await User.findById(userId);
        const cart = req.session.cart || [];

        res.render('checkout', {
            title: 'Checkout',
            user,
            cart,
        });
    }
};

module.exports = CheckoutController;

