const paypal = require('@paypal/checkout-server-sdk');

// Set up PayPal Environment
const environment = new paypal.core.SandboxEnvironment(
    'AdRiao5Vsj_zvcK08j0meMLjzWocw9jgykWmy3_ed1X85mnTtDZa50FSS42A5Lq0CSbhAUKijltli1rT',
    'EEeChF0qX98lwCYe5QKOCg78JfeoQZ-UNFONK0bdmaFsGK-uNsZYOdlO2sWS-iCzZBv6Ihm2ALu_b-pa'
);
const client = new paypal.core.PayPalHttpClient(environment);

// Create a PayPal order
async function createOrder(amount, currency) {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: currency,
                value: amount
            }
        }]
    });

    try {
        const order = await client.execute(request);
        return order.result;
    } catch (err) {
        console.error('Error creating order:', err);
        throw new Error('Failed to create PayPal order');
    }
}

// Capture a PayPal order
async function captureOrder(orderID) {
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({}); // Capture requests require an empty body

    try {
        const capture = await client.execute(request);
        return capture.result;
    } catch (err) {
        console.error('Error capturing order:', err);
        throw new Error('Failed to capture PayPal order');
    }
}

module.exports = {
    createOrder,
    captureOrder
};
