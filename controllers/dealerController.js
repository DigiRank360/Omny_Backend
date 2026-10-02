import Dealer from '../models/Dealer.js';

// PUBLIC: dealer registration form
export const registerDealer = async (req, res) => {
  const { fullName, email, mobile, businessName, city, state, pincode, gstNumber, monthlyVolume, message, password } = req.body;
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ message: 'Create a password with at least 8 characters' });
  }
  const dealer = await Dealer.create({ fullName, email, mobile, businessName, city, state, pincode, gstNumber, monthlyVolume, message, password });
  res.status(201).json({ message: 'Registration received. Our team will contact you shortly.', id: dealer._id });
};

// ADMIN: list with search, filter, pagination
export const getDealers = async (req, res) => {
  const { q = '', status = '', page = 1, limit = 10 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ fullName: rx }, { businessName: rx }, { mobile: rx }, { email: rx }, { city: rx }];
  }
  const [dealers, total, counts] = await Promise.all([
    Dealer.find(filter).select('+password').sort('-createdAt').skip((page - 1) * limit).limit(+limit).lean(),
    Dealer.countDocuments(filter),
    Dealer.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  const stats = { pending: 0, approved: 0, rejected: 0 };
  counts.forEach(c => (stats[c._id] = c.n));
  const safeDealers = dealers.map(({ password, ...dealer }) => ({ ...dealer, hasPortalPassword: Boolean(password) }));
  res.json({ dealers: safeDealers, total, pages: Math.ceil(total / limit), stats });
};

export const updateDealer = async (req, res) => {
  const { status, adminNote, password } = req.body;
  const dealer = await Dealer.findById(req.params.id).select('+password');
  if (!dealer) return res.status(404).json({ message: 'Dealer not found' });
  if (status) dealer.status = status;
  if (adminNote !== undefined) dealer.adminNote = adminNote;
  if (password) {
    if (password.length < 8) return res.status(400).json({ message: 'Dealer password must be at least 8 characters' });
    dealer.password = password;
  }
  await dealer.save();
  res.json({ id: dealer._id, status: dealer.status, adminNote: dealer.adminNote, hasPortalPassword: Boolean(dealer.password) });
};

export const getDealerProfile = async (req, res) => {
  const dealer = req.dealer;
  res.json({
    id: dealer._id,
    fullName: dealer.fullName,
    email: dealer.email,
    mobile: dealer.mobile,
    businessName: dealer.businessName,
    city: dealer.city,
    state: dealer.state,
    pincode: dealer.pincode,
    gstNumber: dealer.gstNumber,
    monthlyVolume: dealer.monthlyVolume,
    status: dealer.status,
    createdAt: dealer.createdAt,
  });
};

export const deleteDealer = async (req, res) => {
  await Dealer.findByIdAndDelete(req.params.id);
  res.json({ message: 'Dealer deleted' });
};
