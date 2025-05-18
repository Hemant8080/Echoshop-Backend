const Product = require("../models/productModel.js");
const ErrorHander = require("../utils/errorhander.js");
const catchAsyncErrors = require("../middleware/catchAsyncErrors.js");
const ApiFeatures = require("../utils/apifeatures");
const cloudinary = require("cloudinary");
const fs = require("fs");

exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
  
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
   
  });
});



exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  let imagesLinks = [];

  const { name, description, price, category, Stock } = req.body;


  if (req.files && req.files.length > 0) {
    for (let file of req.files) {
      const filePath = file.path; // Local path multer ne diya

      const result = await cloudinary.v2.uploader.upload(filePath, {
        folder: "products",
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });

      // Remove local file after upload
      fs.unlinkSync(filePath);
    }
  }

  const product = await Product.create({
    name,
    description,
    price,
    category,
    Stock,
    images: imagesLinks,
    user: req.user.id,
  });

  res.status(201).json({
    success: true,
    product,
  });
});

// Get All Product (Admin)
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
});

// Get Product Details
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// Update Product -- Admin

exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  console.log("Form body:", req.body);
  console.log("Uploaded files:", req.files);

  let product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHander("Product not found", 404));

  // Build updated product data
  const updatedData = {
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    category: req.body.category,
    Stock: req.body.stock,
  };

  // Handle images
  if (req.files && req.files.length > 0) {
    let imagesLinks = [];
    
    // Upload new images to cloudinary
    for (let file of req.files) {
      const result = await cloudinary.v2.uploader.upload(file.path, {
        folder: "products",
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });

      // Remove local file after upload
      fs.unlinkSync(file.path);
    }

    // If there are existing images, keep them
    if (product.images && product.images.length > 0) {
      updatedData.images = [...product.images, ...imagesLinks];
    } else {
      updatedData.images = imagesLinks;
    }
  }

  const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updatedData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    product: updatedProduct,
  });
});


// Delete Product

exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  await product.deleteOne(); // ✅ updated

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// Create New Review or Update the review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString())
        (rev.rating = rating), (rev.comment = comment);
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  let avg = 0;

  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

// Get All Reviews of a product
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// Delete Review
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );

  let avg = 0;

  reviews.forEach((rev) => {
    avg += rev.rating;
  });

  let ratings = 0;

  if (reviews.length === 0) {
    ratings = 0;
  } else {
    ratings = avg / reviews.length;
  }

  const numOfReviews = reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings,
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});
