import Vendor from '../models/Vendor.js';

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);

function validateAttachment(attachment, label) {
  if (!attachment?.data) return;
  if (!ALLOWED_MIME_TYPES.has(attachment.mimeType)) {
    const error = new Error(`${label} must be a JPG, PNG, or PDF file`);
    error.status = 400;
    throw error;
  }
  const dataUrlPrefix = `data:${attachment.mimeType};base64,`;
  if (typeof attachment.data !== 'string' || !attachment.data.startsWith(dataUrlPrefix)) {
    const error = new Error(`${label} is not a valid file upload`);
    error.status = 400;
    throw error;
  }
  const encoded = attachment.data.slice(dataUrlPrefix.length);
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
    const error = new Error(`${label} is not a valid file upload`);
    error.status = 400;
    throw error;
  }
  const bytes = Math.floor(encoded.length * 3 / 4) - (encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0);
  if (bytes > MAX_ATTACHMENT_BYTES) {
    const error = new Error(`${label} must be 5MB or smaller`);
    error.status = 400;
    throw error;
  }
}

export const registerVendor = async (req, res) => {
  const { attachments = {} } = req.body;
  validateAttachment(attachments.cancelledCheque, 'Cancelled cheque');
  validateAttachment(attachments.registrationDocument, 'Registration document');
  const fields = [
    'companyName', 'gstNumber', 'address', 'city', 'state', 'pincode', 'businessType', 'productCategories',
    'stockOffers', 'contactName', 'designation', 'mobile', 'alternateMobile', 'email', 'bankName', 'bankBranch',
    'accountHolderName', 'accountNumber', 'ifscCode', 'attachments', 'declarationAccepted',
  ];
  const payload = Object.fromEntries(fields.filter(field => req.body[field] !== undefined).map(field => [field, req.body[field]]));
  const vendor = await Vendor.create(payload);
  res.status(201).json({ message: 'Vendor registration received. Our procurement team will contact you.', id: vendor._id });
};

export const getVendors = async (req, res) => {
  const { q = '', status = '', page = 1, limit = 10 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (q) {
    const expression = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { companyName: expression }, { contactName: expression }, { mobile: expression },
      { email: expression }, { gstNumber: expression }, { city: expression },
    ];
  }
  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
  const [vendors, total, counts] = await Promise.all([
    Vendor.find(filter).select('-attachments').sort('-createdAt').skip((pageNumber - 1) * pageSize).limit(pageSize).lean(),
    Vendor.countDocuments(filter),
    Vendor.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  const stats = { pending: 0, approved: 0, rejected: 0 };
  counts.forEach(item => { stats[item._id] = item.count; });
  res.json({ vendors, total, pages: Math.ceil(total / pageSize), stats });
};

export const getVendor = async (req, res) => {
  const vendor = await Vendor.findById(req.params.id).lean();
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
  res.json(vendor);
};

export const updateVendor = async (req, res) => {
  const { status, adminNote } = req.body;
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, { status, adminNote }, { new: true, runValidators: true });
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
  res.json(vendor);
};

export const deleteVendor = async (req, res) => {
  const vendor = await Vendor.findByIdAndDelete(req.params.id);
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
  res.json({ message: 'Vendor deleted' });
};
