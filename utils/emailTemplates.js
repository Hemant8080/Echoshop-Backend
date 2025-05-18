/**
 * Email templates for various notifications
 */

// Payment success email template
const getPaymentSuccessTemplate = (orderDetails) => {
  const { _id, totalPrice, shippingInfo, orderItems, paymentInfo } = orderDetails;
  
  // Format the order items for email
  const itemsList = orderItems.map(item => 
    `- ${item.name} x ${item.quantity}: ₹${item.price * item.quantity}`
  ).join('\n');
  
  return `
Dear Customer,

Thank you for your purchase at EcoShop!

We're pleased to confirm that your payment of ₹${totalPrice.toFixed(2)} has been successfully processed.

Order Details:
--------------
Order ID: ${_id}
Payment ID: ${paymentInfo.id}
Date: ${new Date().toLocaleDateString()}

Items Purchased:
${itemsList}

Total Amount: ₹${totalPrice.toFixed(2)}

Shipping Address:
${shippingInfo.address}
${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.pinCode}
${shippingInfo.country}

Your order is now being processed and will be shipped soon. You can track your order status by logging into your account.

If you have any questions about your order, please contact our customer service team.

Thank you for shopping with EcoShop!

Best regards,
The EcoShop Team
`;
};

// Order cancellation email template
const getOrderCancellationTemplate = (orderDetails) => {
  const { _id, totalPrice, orderItems, createdAt } = orderDetails;
  
  // Format the order items for email
  const itemsList = orderItems.map(item => 
    `- ${item.name} x ${item.quantity}: ₹${item.price * item.quantity}`
  ).join('\n');
  
  // Format dates
  const orderDate = new Date(createdAt).toLocaleDateString();
  const cancellationDate = new Date().toLocaleDateString();
  
  return `
Dear Customer,

Your order has been cancelled as requested.

Cancelled Order Details:
-----------------------
Order ID: ${_id}
Order Date: ${orderDate}
Cancellation Date: ${cancellationDate}

Cancelled Items:
${itemsList}

Refund Amount: ₹${totalPrice.toFixed(2)}

Your payment will be refunded to your original payment method within 5-7 business days, depending on your bank's processing time.

If you cancelled this order by mistake or would like to place a new order, please visit our website.

If you have any questions about your cancellation or refund, please contact our customer service team.

We hope to serve you again soon.

Best regards,
The EcoShop Team
`;
};

module.exports = {
  getPaymentSuccessTemplate,
  getOrderCancellationTemplate
};
