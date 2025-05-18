const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendEmail = require("../utils/sendEmail");
const { getPaymentSuccessTemplate, getOrderCancellationTemplate } = require("../utils/emailTemplates");

// Create new Order with Shipping Information
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    shippingInfo: { address, city, state, country, pinCode, phoneNo },
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  const order = await Order.create({
    shippingInfo: {
      address,
      city,
      state,
      country,
      pinCode,
      phoneNo,
    },
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paidAt: Date.now(),
    user: req.user._id,
  });

  // Send payment confirmation email
  try {
    // Get user email
    const user = await User.findById(req.user._id);
    if (user && user.email) {
      const emailTemplate = getPaymentSuccessTemplate(order);
      await sendEmail({
        email: user.email,
        subject: "EcoShop - Payment Successful",
        message: emailTemplate,
      });
      console.log(`Payment confirmation email sent to ${user.email}`);
    }
  } catch (error) {
    console.error("Error sending payment confirmation email:", error);
    // Don't throw error as the order was still created successfully
  }

  res.status(201).json({
    success: true,
    order,
  });
});

// get Single Order
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    return next(new ErrorHander("Order not found with this Id", 404));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

// get logged in user  Orders
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });

  res.status(200).json({
    success: true,
    orders,
  });
});

// get all Orders -- Admin
exports.getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find().populate("user", "name email");

  let totalAmount = 0;

  orders.forEach((order) => {
    totalAmount += order.totalPrice;
  });

  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});

// update Order Status -- Admin
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHander("Order not found with this Id", 404));
  }

  if (order.orderStatus === "Delivered") {
    return next(new ErrorHander("You have already delivered this order", 400));
  }

  if (req.body.status === "Shipped") {
    order.orderItems.forEach(async (o) => {
      await updateStock(o.product, o.quantity);
    });
  }
  order.orderStatus = req.body.status;

  if (req.body.status === "Delivered") {
    order.deliveredAt = Date.now();
  }

  await order.save({ validateBeforeSave: false });
  res.status(200).json({
    success: true,
  });
});

async function updateStock(id, quantity) {
  const product = await Product.findById(id);

  product.Stock -= quantity;

  await product.save({ validateBeforeSave: false });
}

// Cancel Order -- User
exports.cancelOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHander("Order not found with this Id", 404));
  }

  // Check if the order belongs to the user making the request
  if (order.user.toString() !== req.user._id.toString()) {
    return next(new ErrorHander("You are not authorized to cancel this order", 403));
  }

  // Check if order can be cancelled (only if it's in Processing state)
  if (order.orderStatus !== "Processing") {
    return next(new ErrorHander(`Order cannot be cancelled as it is already ${order.orderStatus}`, 400));
  }

  // Update order status to Cancelled
  order.orderStatus = "Cancelled";
  await order.save({ validateBeforeSave: false });

  // If items were reserved, return them to stock
  order.orderItems.forEach(async (item) => {
    const product = await Product.findById(item.product);
    if (product) {
      product.Stock += item.quantity;
      await product.save({ validateBeforeSave: false });
    }
  });

  // Send cancellation email
  try {
    const user = await User.findById(req.user._id);
    if (user && user.email) {
      const emailTemplate = getOrderCancellationTemplate(order);
      await sendEmail({
        email: user.email,
        subject: "EcoShop - Order Cancelled",
        message: emailTemplate,
      });
      console.log(`Order cancellation email sent to ${user.email}`);
    }
  } catch (error) {
    console.error("Error sending order cancellation email:", error);
    // Don't throw error as the order was still cancelled successfully
  }

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully"
  });
});

// delete Order -- Admin
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHander("Order not found with this Id", 404));
  }

  await order.remove();

  res.status(200).json({
    success: true,
  });
});
