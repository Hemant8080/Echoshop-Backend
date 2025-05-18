const jwt = require('jsonwebtoken');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('./catchAsyncErrors');
const User = require('../models/userModel');

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  // Get token from cookie or Authorization header
  let token;
  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorHandler('Please Login to access this resource', 401));
  }

  try {
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decodedData.id);
    next();
  } catch (error) {
    return next(new ErrorHandler('Invalid token. Please login again.', 401));
  }
}); 