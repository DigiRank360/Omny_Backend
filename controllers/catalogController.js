import Category from '../models/Category.js';
import Product from '../models/Product.js';

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const productFields = ['name', 'brand', 'model', 'category', 'grade', 'price', 'stock', 'description', 'image', 'active'];
const pickProductFields = body => Object.fromEntries(productFields.filter(field => body[field] !== undefined).map(field => [field, body[field]]));

export const getCategories = async (req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find().sort('name').lean(),
    Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const countByCategory = new Map(counts.map(item => [String(item._id), item.count]));
  res.json(categories.map(category => ({ ...category, productCount: countByCategory.get(String(category._id)) || 0 })));
};

export const createCategory = async (req, res) => {
  const category = await Category.create({ name: req.body.name, description: req.body.description });
  res.status(201).json(category);
};

export const updateCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id,
    { name: req.body.name, description: req.body.description, active: req.body.active },
    { new: true, runValidators: true });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
};

export const deleteCategory = async (req, res) => {
  const productCount = await Product.countDocuments({ category: req.params.id });
  if (productCount) return res.status(409).json({ message: 'Move or delete products in this category first' });
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json({ message: 'Category deleted' });
};

export const getProducts = async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.active === 'true' || req.query.active === 'false') filter.active = req.query.active === 'true';
  if (req.query.q) {
    const expression = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: expression }, { brand: expression }, { model: expression }];
  }
  const products = await Product.find(filter).populate('category', 'name').sort('-createdAt').limit(500).lean();
  res.json(products);
};

export const getStoreProducts = async (req, res) => {
  const filter = { active: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.q) {
    const expression = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: expression }, { brand: expression }, { model: expression }];
  }
  const products = await Product.find(filter).populate('category', 'name').sort('-updatedAt').lean();
  res.json(products);
};

export const createProduct = async (req, res) => {
  const product = await Product.create(pickProductFields(req.body));
  await product.populate('category', 'name');
  res.status(201).json(product);
};

export const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, pickProductFields(req.body),
    { new: true, runValidators: true }).populate('category', 'name');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
};

export const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ message: 'Product deleted' });
};