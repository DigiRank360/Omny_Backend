
import { Router } from 'express';
import { protect, protectDealer } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { dealerLogin, login } from '../controllers/authController.js';
import { registerDealer, getDealerProfile, getDealers, updateDealer, deleteDealer } from '../controllers/dealerController.js';
import { createCategory, createProduct, deleteCategory, deleteProduct, getCategories, getProducts, getStoreProducts, updateCategory, updateProduct } from '../controllers/catalogController.js';
import { deleteVendor, getVendor, getVendors, registerVendor, updateVendor } from '../controllers/vendorController.js';
import { createSalesRequest, getProductEnquiries, getSalesRequests, sendProductEnquiry, updateProductEnquiry, updateSalesRequest } from '../controllers/salesRequestController.js';

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const r = Router();

r.post('/auth/login', wrap(login));
r.post('/dealer/auth/login', wrap(dealerLogin));
r.get('/dealer/me', protectDealer, wrap(getDealerProfile));
r.post('/dealer/product-enquiries', protectDealer, wrap(sendProductEnquiry));
r.post('/dealer/sales-requests', protectDealer, wrap(createSalesRequest));
r.post('/dealers/register', wrap(registerDealer));
r.post('/vendors/register', protect, wrap(registerVendor));
r.get('/store/products', wrap(getStoreProducts));
r.get('/dealers', protect, wrap(getDealers));
r.patch('/dealers/:id', protect, wrap(updateDealer));
r.delete('/dealers/:id', protect, wrap(deleteDealer));
r.get('/vendors', protect, wrap(getVendors));
r.get('/vendors/:id', protect, wrap(getVendor));
r.patch('/vendors/:id', protect, wrap(updateVendor));
r.delete('/vendors/:id', protect, wrap(deleteVendor));
r.get('/sales-requests', protect, wrap(getSalesRequests));
r.patch('/sales-requests/:id', protect, wrap(updateSalesRequest));
r.get('/product-enquiries', protect, wrap(getProductEnquiries));
r.patch('/product-enquiries/:id', protect, wrap(updateProductEnquiry));
r.get('/categories', protect, wrap(getCategories));
r.post('/categories', protect, wrap(createCategory));
r.patch('/categories/:id', protect, wrap(updateCategory));
r.delete('/categories/:id', protect, wrap(deleteCategory));

r.get('/products', protect, wrap(getProducts));
r.post('/products', protect, upload.single('image'), wrap(createProduct));
r.patch('/products/:id', protect, upload.single('image'), wrap(updateProduct));
r.delete('/products/:id', protect, wrap(deleteProduct));

export default r;
