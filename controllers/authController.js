import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Dealer from '../models/Dealer.js';
export const login = async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email: (email || '').toLowerCase() });
  if (!admin || !(await admin.matches(password || '')))
    return res.status(401).json({ message: 'Invalid email or password' });
  const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, email: admin.email });
};

export const dealerLogin = async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  const dealer = await Dealer.findOne({ email }).select('+password');
  if (!dealer || !(await dealer.matchesPassword(password))) {
    return res.status(401).json({ message: 'Email or password is incorrect' });
  }
  if (dealer.status !== 'approved') {
    return res.status(403).json({ message: dealer.status === 'pending' ? 'Your dealer application is awaiting approval.' : 'This dealer account is not active.' });
  }
  const token = jwt.sign({ id: dealer._id, role: 'dealer' }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, dealer: { id: dealer._id, name: dealer.fullName, businessName: dealer.businessName, email: dealer.email, status: dealer.status } });
};
