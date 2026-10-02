export const notFound = (req, res) => res.status(404).json({ message: 'Route not found' });
export const errorHandler = (err, req, res, next) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    const message = field === 'mobile' ? 'This mobile number is already registered' : `${field || 'Value'} already exists`;
    return res.status(409).json({ message });
  }
  if (err.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') });
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
};
