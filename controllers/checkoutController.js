const Order = require('../models/order');
const OrderItem = require('../models/orderItem');
const User = require('../models/user')
const Product = require('../models/product'); 
const CheckoutController = {
    checkout: async (req, res) => {
        const userId = req.session.userId; 
        const cart = req.session.cart || [];

        if (!cart.length) {
            return res.status(400).json({ message: 'Cart is empty.' });
        }

        // Calculate total price
        const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);

        // Create order
        const orderId = await Order.create(userId, totalPrice);

        // Create order items and update stock quantity
        for (const item of cart) {
            // Create order item
            await OrderItem.create(orderId, item.productId, item.quantity);
            const product = await Product.findById(item.productId)

            // Update stock quantity
            console.log('Current Stock Quan: ', product.stock_quantity)
            console.log('item Bought: ', item.quantity)
            const newStockQuantity = product.stock_quantity - item.quantity; // Calculate new stock quantity
            await Product.updateStock(item.productId, newStockQuantity); // Call the updateStock method to update the quantity
        }

        // Clear the cart after successful checkout
        req.session.cart = [];
        // res.status(201).json({ message: 'Order created successfully.', orderId });
        return res.redirect('/thankyou'); 
    },
    
    renderCheckout: async (req, res) => {
        const userId = req.session.userId; // Get user ID from the session
        const user = await User.findById(userId); 
        const cart = req.session.cart || []; // Get cart items from the session

        res.render('checkout', {
            title: 'Checkout',
            user, // Pass user details to the view
            cart, // Pass cart items to the view
            
        });
    }
};

module.exports = CheckoutController;
