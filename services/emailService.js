const nodemailer = require('nodemailer');

// Configure your email transport options
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'johnpauldanmachi@gmail.com', 
        pass: 'wyak bpzk oxpg wsrb' 
    }
});

const sendVerificationEmail = (email, verificationToken) => {
    const verificationLink = `http://localhost:3000/verify/${verificationToken}`;

    const mailOptions = {
        from: '"Furni" <johnpauldanmachi@gmail.com>', 
        to: email,
        subject: 'Email Verification',
        text: `Please verify your email by clicking the link: ${verificationLink}`,
        html: `<p>Please verify your email by clicking the link: <a href="${verificationLink}">Verify Email</a></p>`
    };

    return transporter.sendMail(mailOptions);
};

const sendOrderConfirmationEmail = async (email, orderId, cart, totalPrice) => {
    const orderDate = new Date().toLocaleString();

    let itemsList = cart.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    const mailOptions = {
        from: '"Furni" <johnpauldanmachi@gmail.com>',
        to: email,
        subject: 'Order Confirmation',
        html: `
            <h1>Thank you for your order!</h1>
            <p>Order ID: ${orderId}</p>
            <p>Order Date: ${orderDate}</p>
            <table border="1" cellpadding="10" cellspacing="0">
                <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                </tr>
                ${itemsList}
                <tr>
                    <td colspan="3" align="right"><strong>Total:</strong></td>
                    <td><strong>$${totalPrice.toFixed(2)}</strong></td>
                </tr>
            </table>
            <p>Thank you for shopping with Furni!</p>
        `
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendOrderConfirmationEmail };

