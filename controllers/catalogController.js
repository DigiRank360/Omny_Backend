//controllers/catalogController.js
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';

// Escape special regex characters
const escapeRegex = value =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Product fields (image is handled separately)
const productFields = [
  'name',
  'brand',
  'model',
  'category',
  'grade',
  'price',
  'stock',
  'description',
  'active',
];

const pickProductFields = body =>
  Object.fromEntries(
    productFields
      .filter(field => body[field] !== undefined)
      .map(field => [field, body[field]])
  );

// Upload image buffer directly to Cloudinary
const uploadToCloudinary = buffer => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'omnyx/products',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);

        resolve({
          image: result.secure_url,
          imagePublicId: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });
};

// Delete Cloudinary image
const deleteCloudinaryImage = async publicId => {
  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId);
};

// Categories
export const getCategories = async (req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find().sort('name').lean(),
    Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const countByCategory = new Map(
    counts.map(item => [String(item._id), item.count])
  );

  res.json(
    categories.map(category => ({
      ...category,
      productCount:
        countByCategory.get(String(category._id)) || 0,
    }))
  );
};

export const createCategory = async (req, res) => {
  const category = await Category.create({
    name: req.body.name,
    description: req.body.description,
  });

  res.status(201).json(category);
};

export const updateCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      active: req.body.active,
    },
    { new: true, runValidators: true }
  );

  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  res.json(category);
};

export const deleteCategory = async (req, res) => {
  const productCount = await Product.countDocuments({
    category: req.params.id,
  });

  if (productCount) {
    return res.status(409).json({
      message: 'Move or delete products in this category first',
    });
  }

  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  res.json({ message: 'Category deleted' });
};

// Products
export const getProducts = async (req, res) => {
  const filter = {};

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.active === 'true' || req.query.active === 'false') {
    filter.active = req.query.active === 'true';
  }

  if (req.query.q) {
    const expression = new RegExp(escapeRegex(req.query.q), 'i');

    filter.$or = [
      { name: expression },
      { brand: expression },
      { model: expression },
    ];
  }

  const products = await Product.find(filter)
    .populate('category', 'name')
    .sort('-createdAt')
    .limit(500)
    .lean();

  res.json(products);
};

export const getStoreProducts = async (req, res) => {
  const filter = { active: true };

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.q) {
    const expression = new RegExp(escapeRegex(req.query.q), 'i');

    filter.$or = [
      { name: expression },
      { brand: expression },
      { model: expression },
    ];
  }

  const products = await Product.find(filter)
    .populate('category', 'name')
    .sort('-updatedAt')
    .lean();

  res.json(products);
};

// Create product
export const createProduct = async (req, res) => {
  const productData = pickProductFields(req.body);

  let uploadedImage = null;

  try {
    if (req.file) {
      uploadedImage = await uploadToCloudinary(req.file.buffer);

      productData.image = uploadedImage.image;
      productData.imagePublicId = uploadedImage.imagePublicId;
    }

    const product = await Product.create(productData);

    await product.populate('category', 'name');

    res.status(201).json(product);
  } catch (error) {
    if (uploadedImage?.imagePublicId) {
      await deleteCloudinaryImage(
        uploadedImage.imagePublicId
      ).catch(() => {});
    }

    throw error;
  }
};

// Update product
export const updateProduct = async (req, res) => {
  const existingProduct = await Product.findById(req.params.id);

  if (!existingProduct) {
    return res.status(404).json({
      message: 'Product not found',
    });
  }

  const productData = pickProductFields(req.body);

  let uploadedImage = null;

  try {
    if (req.file) {
      uploadedImage = await uploadToCloudinary(req.file.buffer);

      productData.image = uploadedImage.image;
      productData.imagePublicId = uploadedImage.imagePublicId;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    // Delete old Cloudinary image only after successful DB update
    if (uploadedImage && existingProduct.imagePublicId) {
      await deleteCloudinaryImage(
        existingProduct.imagePublicId
      ).catch(error => {
        console.error(
          'Old Cloudinary image deletion failed:',
          error.message
        );
      });
    }

    res.json(product);
  } catch (error) {
    // Clean up newly uploaded image if DB update fails
    if (uploadedImage?.imagePublicId) {
      await deleteCloudinaryImage(
        uploadedImage.imagePublicId
      ).catch(() => {});
    }

    throw error;
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return res.status(404).json({
      message: 'Product not found',
    });
  }

  if (product.imagePublicId) {
    await deleteCloudinaryImage(
      product.imagePublicId
    ).catch(error => {
      console.error(
        'Cloudinary image deletion failed:',
        error.message
      );
    });
  }

  res.json({ message: 'Product deleted' });
};