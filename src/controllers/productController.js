// Create Product
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  try {
    const { name, description, price, category, Stock } = req.body;
    const images = req.files?.images || [];

    console.log('Received files:', req.files);
    console.log('Received body:', req.body);

    // Validate required fields
    if (!name || !description || !price || !category || !images || images.length === 0) {
      return next(new ErrorHandler("Please provide all required fields", 400));
    }

    const imagesLinks = [];

    // Upload images to Cloudinary
    for (let i = 0; i < images.length; i++) {
      try {
        const result = await cloudinary.v2.uploader.upload(images[i].path, {
          folder: "products",
        });

        console.log('Cloudinary upload result:', result);

        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        return next(new ErrorHandler(`Failed to upload image: ${error.message}`, 500));
      }
    }

    console.log('Cloudinary upload results:', imagesLinks);

    // Create product with Cloudinary image data
    const product = await Product.create({
      name,
      description,
      price,
      category,
      Stock: Stock || 1,
      images: imagesLinks,
      user: req.user._id
    });

    console.log('Created product:', product);

    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error in createProduct:', error);
    return next(new ErrorHandler(error.message, 500));
  }
}); 