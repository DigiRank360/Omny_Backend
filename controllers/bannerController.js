import Banner from '../models/Banner.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = './public/uploads/banners';

export const getBanners = async (req, res) => {
  const banners = await Banner.find().sort({ type: 1, createdAt: -1 });
  res.json(banners);
};

export const getActiveBanners = async (req, res) => {
  const banners = await Banner.find({ isActive: true }).sort({ type: 1, createdAt: -1 });
  res.json(banners);
};

export const createBanner = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  const { type } = req.body;

  if (!['desktop', 'mobile', 'tablet'].includes(type)) {
    return res.status(400).json({ error: 'Invalid banner type' });
  }

  try {
    // Ensure upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Generate filename with UUID
    const ext = path.extname(req.file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Move file from temp to upload directory
    await fs.writeFile(filepath, req.file.buffer);

    const banner = new Banner({
      type,
      filename,
      imageUrl: `/uploads/banners/${filename}`,
      isActive: true,
    });

    await banner.save();
    res.status(201).json(banner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBannerStatus = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const banner = await Banner.findByIdAndUpdate(
    id,
    { isActive, updatedAt: Date.now() },
    { new: true }
  );

  if (!banner) {
    return res.status(404).json({ error: 'Banner not found' });
  }

  res.json(banner);
};

export const deleteBanner = async (req, res) => {
  const { id } = req.params;

  const banner = await Banner.findByIdAndDelete(id);

  if (!banner) {
    return res.status(404).json({ error: 'Banner not found' });
  }

  // Delete file from filesystem
  try {
    const filepath = path.join(UPLOAD_DIR, banner.filename);
    await fs.unlink(filepath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }

  res.json({ success: true, message: 'Banner deleted' });
};
