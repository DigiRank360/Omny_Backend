import jwt from 'jsonwebtoken';
import Dealer from '../models/Dealer.js';
export const protect = (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    if (req.admin.role === 'dealer') return res.status(403).json({ message: 'Admin access required' });
    next();
  }
  catch { res.status(401).json({ message: 'Not authorised, please login again' }); }
};

export const protectDealer = async (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'dealer') return res.status(401).json({ message: 'Dealer login required' });
    const dealer = await Dealer.findById(payload.id);
    if (!dealer || dealer.status !== 'approved') return res.status(403).json({ message: 'Dealer account is not approved' });
    req.dealer = dealer;
    next();
  } catch {
    res.status(401).json({ message: 'Dealer login expired. Please sign in again.' });
  }
};
