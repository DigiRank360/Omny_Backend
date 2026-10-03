import mongoose from 'mongoose';
import Product from '../models/Product.js';
import ProductEnquiry from '../models/ProductEnquiry.js';
import SalesRequest from '../models/SalesRequest.js';
import { SALES_EMAIL, SUPPORT_EMAIL, sendEmail } from '../utils/email.js';

function dealerDetails(dealer) {
  return [
    `Dealer: ${dealer.fullName}`,
    `Business: ${dealer.businessName}`,
    `Email: ${dealer.email}`,
    `Mobile: ${dealer.mobile}`,
    `Location: ${dealer.city}, ${dealer.state}`,
  ].join('\n');
}

async function findProduct(productId) {
  if (!mongoose.isValidObjectId(productId)) {
    const error = new Error('Product not found');
    error.status = 404;
    throw error;
  }
  const product = await Product.findOne({ _id: productId, active: true });
  if (!product) {
    const error = new Error('Product is no longer available');
    error.status = 404;
    throw error;
  }
  return product;
}

export const sendProductEnquiry = async (req, res) => {
  const product = await findProduct(req.body.productId);
  const enquiry = await ProductEnquiry.create({
    dealer: req.dealer._id,
    dealerName: req.dealer.fullName,
    dealerEmail: req.dealer.email,
    dealerMobile: req.dealer.mobile,
    businessName: req.dealer.businessName,
    product: product._id,
    productName: product.name,
    brand: product.brand,
    model: product.model,
    grade: product.grade,
    unitPrice: product.price,
    stockAtEnquiry: product.stock,
  });
  const productName = `${product.brand} ${product.name}${product.model ? ` · ${product.model}` : ''}`;
  let emailSent = true;
  try {
    await sendEmail({
      to: SUPPORT_EMAIL,
      replyTo: req.dealer.email,
      subject: `Dealer enquiry: ${productName}`,
      text: `${dealerDetails(req.dealer)}\n\nProduct: ${productName}\nGrade: ${product.grade}\nDealer price: INR ${product.price}\nAvailable stock: ${product.stock}\nEnquiry ID: ${enquiry._id}\n\nPlease contact the dealer about this product enquiry.`,
    });
  } catch {
    emailSent = false;
  }
  res.status(201).json({
    message: emailSent ? 'Your enquiry has been sent to dealer support.' : 'Your enquiry is saved for admin follow-up; email could not be sent.',
    emailSent,
    enquiryId: enquiry._id,
  });
};

export const getProductEnquiries = async (req, res) => {
  const allowedStatuses = new Set(['new', 'contacted', 'closed']);
  const status = allowedStatuses.has(req.query.status) ? req.query.status : '';
  const filter = status ? { status } : {};
  const [enquiries, newCount, total] = await Promise.all([
    ProductEnquiry.find(filter).sort('-createdAt').limit(100).lean(),
    ProductEnquiry.countDocuments({ status: 'new' }),
    ProductEnquiry.countDocuments(),
  ]);
  res.json({ enquiries, newCount, total });
};

export const updateProductEnquiry = async (req, res) => {
  const { status } = req.body;
  if (!['contacted', 'closed'].includes(status)) {
    return res.status(400).json({ message: 'Choose a valid enquiry status.' });
  }
  const enquiry = await ProductEnquiry.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
  if (!enquiry) return res.status(404).json({ message: 'Product enquiry not found.' });
  res.json(enquiry);
};

export const createSalesRequest = async (req, res) => {
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
    return res.status(400).json({ message: 'Quantity must be between 1 and 10,000.' });
  }

  const product = await findProduct(req.body.productId);
  const request = await SalesRequest.create({
    dealer: req.dealer._id,
    dealerName: req.dealer.fullName,
    dealerEmail: req.dealer.email,
    dealerMobile: req.dealer.mobile,
    businessName: req.dealer.businessName,
    product: product._id,
    productName: product.name,
    brand: product.brand,
    model: product.model,
    grade: product.grade,
    quantity,
    unitPrice: product.price,
    stockAtRequest: product.stock,
  });

  let emailSent = true;
  try {
    const productName = `${product.brand} ${product.name}${product.model ? ` · ${product.model}` : ''}`;
    await sendEmail({
      to: SALES_EMAIL,
      replyTo: req.dealer.email,
      subject: `Dealer sales request: ${productName} (${quantity} units)`,
      text: `${dealerDetails(req.dealer)}\n\nProduct: ${productName}\nGrade: ${product.grade}\nRequested quantity: ${quantity}\nDealer price at request: INR ${product.price}\nAvailable stock at request: ${product.stock}\nRequest ID: ${request._id}\n\nPlease follow up with the dealer.`,
    });
  } catch {
    emailSent = false;
  }

  res.status(201).json({
    message: emailSent ? 'Sales request sent.' : 'Sales request saved for admin follow-up; email could not be sent.',
    emailSent,
    requestId: request._id,
  });
};

export const getSalesRequests = async (req, res) => {
  const allowedStatuses = new Set(['new', 'contacted', 'closed']);
  const status = allowedStatuses.has(req.query.status) ? req.query.status : '';
  const filter = status ? { status } : {};
  const [requests, newCount, total] = await Promise.all([
    SalesRequest.find(filter).sort('-createdAt').limit(100).lean(),
    SalesRequest.countDocuments({ status: 'new' }),
    SalesRequest.countDocuments(),
  ]);
  res.json({ requests, newCount, total });
};

export const updateSalesRequest = async (req, res) => {
  const { status } = req.body;
  if (!['contacted', 'closed'].includes(status)) {
    return res.status(400).json({ message: 'Choose a valid request status.' });
  }
  const request = await SalesRequest.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
  if (!request) return res.status(404).json({ message: 'Sales request not found.' });
  res.json(request);
};