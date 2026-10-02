import { Router } from 'express';
import { protect, protectDealer } from '../middleware/auth.js';
import { dealerLogin, login } from '../controllers/authController.js';
import { registerDealer, getDealerProfile, getDealers, updateDealer, deleteDealer } from '../controllers/dealerController.js';
import { createCategory, createProduct, deleteCategory, deleteProduct, getCategories, getProducts, getStoreProducts, updateCategory, updateProduct } from '../controllers/catalogController.js';
import { deleteVendor, getVendor, getVendors, registerVendor, updateVendor } from '../controllers/vendorController.js';

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const r = Router();
r.post('/auth/login', wrap(login));
r.post('/dealer/auth/login', wrap(dealerLogin));
r.get('/dealer/me', protectDealer, wrap(getDealerProfile));
r.post('/dealers/register', wrap(registerDealer));          // public
r.post('/vendors/register', wrap(registerVendor));          // public supplier registration
r.get('/store/products', wrap(getStoreProducts));           // public active inventory
r.get('/dealers', protect, wrap(getDealers));               // admin
r.patch('/dealers/:id', protect, wrap(updateDealer));       // admin
r.delete('/dealers/:id', protect, wrap(deleteDealer));      // admin
r.get('/vendors', protect, wrap(getVendors));
r.get('/vendors/:id', protect, wrap(getVendor));
r.patch('/vendors/:id', protect, wrap(updateVendor));
r.delete('/vendors/:id', protect, wrap(deleteVendor));
r.get('/categories', protect, wrap(getCategories));
r.post('/categories', protect, wrap(createCategory));
r.patch('/categories/:id', protect, wrap(updateCategory));
r.delete('/categories/:id', protect, wrap(deleteCategory));
r.get('/products', protect, wrap(getProducts));
r.post('/products', protect, wrap(createProduct));
r.patch('/products/:id', protect, wrap(updateProduct));
r.delete('/products/:id', protect, wrap(deleteProduct));
export default r;
