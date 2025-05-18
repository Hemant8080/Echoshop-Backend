const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const { createProduct } = require('../controllers/productController');
const upload = require('../middleware/multer');

// Create new product
router.post(
  '/admin/product/new',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  upload.array('images', 5), // Allow up to 5 images
  createProduct
);

module.exports = router; 