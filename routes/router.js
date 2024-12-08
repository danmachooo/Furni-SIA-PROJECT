const express = require('express');
const { register, login, logout, renderLogin, renderRegister, verifyEmail } = require('../controllers/authController');
const ProductController = require('../controllers/productController');
const OrderController = require('../controllers/orderController');
const OrderItemController = require('../controllers/orderItemController');
const CartController = require('../controllers/cartController');
const CheckoutController = require('../controllers/checkoutController');
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware'); // Authentication middleware
const upload = require('../middlewares/multerMiddleware'); // Multer middleware for file uploads
const {paypal} = require('../services/paypal');

const router = express.Router();
const { pool } = require('../config/db');

// Auth routes
router.post('/register-user', register);
router.post('/login-user', login);
router.get('/logout', logout);
router.get('/login', renderLogin);
router.get('/register', renderRegister);
router.get('/verify/:token', verifyEmail);

// Admin routes
// router.get('/admin', authMiddleware, (req, res) => {
//     res.render('adminForm', { title: 'Admin home page' });
// });
router.get('/admin', authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT COUNT(*) AS total FROM users');
        const [products] = await pool.query('SELECT COUNT(*) AS total FROM products');
        const [orders] = await pool.query('SELECT COUNT(*) AS total FROM orders');
    
        // Fetch monthly sales data (adjust the query as needed)
        const [salesData] = await pool.query(`
          SELECT MONTH(created_at) AS month, SUM(total_price) AS total
          FROM orders
          WHERE YEAR(created_at) = YEAR(CURRENT_DATE())
          GROUP BY month
        `);
    
        const monthlySales = new Array(12).fill(0); // Initialize the array with zeros
        salesData.forEach(sale => {
          monthlySales[sale.month - 1] = parseFloat(sale.total) || 0; // Ensure total is a number
        });

        console.log(monthlySales);
        res.render('adminForm', {
          totalUsers: users[0].total,
          totalProducts: products[0].total,
          totalOrders: orders[0].total,
          monthlySales: monthlySales // Pass monthly sales data to EJS
        });
      } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
      }
  });

router.get('/admin/user-management', authMiddleware, UserController.displayAllUser);
router.post('/admin/user-management/update-user/:id', UserController.updateUser);

// Product Management (Admin)
router.get('/admin/product-management',authMiddleware, ProductController.displayAllInAdmin);
router.get('/admin/product-management/add-form',authMiddleware, ProductController.renderCreate);
router.post('/admin/product-management/add-form/add-product',authMiddleware, upload.single('image'), ProductController.create);
router.get('/admin/product-management/update-product/:id',authMiddleware, ProductController.renderUpdate);
router.post('/admin/product-management/update-product/:id',authMiddleware, upload.single('image'), ProductController.update);
router.delete('/admin/product-management/delete-product/:id',authMiddleware, ProductController.delete);

// Order Management (Admin)
router.get('/admin/order-management',authMiddleware, OrderController.getAll); // View all orders
router.post('/admin/order-management/update-status/:id',authMiddleware, OrderController.updateStatus); // Update order status
router.delete('/admin/order-management/delete-order/:id',authMiddleware, OrderController.delete); // Update order status
router.get('/admin/order-management/:id',authMiddleware, OrderController.getById); // Get a specific order by ID

// User Routes
router.get('/order-history', OrderController.getByUserId); // Get orders for the logged-in user

// Public Product routes
router.get('/shop', authMiddleware, ProductController.getAll); // Shop route (Protected by authMiddleware)
router.get('/product/:id', ProductController.getById); // Get product by ID

// Order routes (General)
router.post('/orders', OrderController.create);
router.get('/orders/:id', OrderController.getById);
router.get('/orders/user', OrderController.getByUserId); 
router.post('/orders/:id/status', OrderController.updateStatus);

// Order Item routes
router.get('/order-items/:orderId', OrderItemController.getByOrderId);
router.delete('/order-items/:id', OrderItemController.delete);

// Cart routes
router.post('/cart/add',authMiddleware, CartController.addItem);
router.get('/cart',authMiddleware, CartController.viewCart);
router.put('/cart/update/:productId',authMiddleware, CartController.updateItem);
router.delete('/cart/remove/:productId',authMiddleware, CartController.removeItem);
router.delete('/cart/clear',authMiddleware, CartController.clearCart);

// Checkout routes
router.post('/checkout', authMiddleware, CheckoutController.checkout);
router.get('/checkout-page', authMiddleware, CheckoutController.renderCheckout);

// Thank you page after successful checkout
router.get('/thankyou', (req, res) => {
    res.render('thankyou', { title: 'Thank You' });
});

//basic route
router.get('/about', (req, res) => {
  res.render('about', {title: 'About'} );
});
router.get('/contact', (req, res) => {
  res.render('contact', {title: 'contact'} );
});
router.get('/profile', UserController.displayUser);

router.post('/profile/update-name/:id', UserController.updateName);
router.post('/profile/change-password/:id', UserController.updatePassword);
//PAYPAL ROUTES


router.post('/create-order', async (req, res) => {
  const { amount, currency } = req.body; // Dynamic values from frontend
  try {
    const order = await paypal.createOrder(amount, currency);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/capture-order/:orderID', async (req, res) => {
  const { orderID } = req.params;
  
  // Create request to capture payment
  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({}); // The request body must be empty for capture
  
  try {
    const capture = await client.execute(request);
    console.log('Capture details:', capture.result);
    res.json(capture.result); // Send response back to the frontend
  } catch (err) {
    console.error('Error capturing order:', err);
    res.status(500).send({ error: 'Something went wrong while capturing the order' });
  }
});
module.exports = router;