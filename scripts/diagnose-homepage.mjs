#!/usr/bin/env node
/**
 * Homepage Debug Script
 * Comprehensive check for homepage rendering issues
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../public/uploads/banners');

// Try to import models
let Banner;
try {
  const bannerModule = await import('../models/Banner.js');
  Banner = bannerModule.default;
} catch (e) {
  console.error('Could not load Banner model:', e.message);
  process.exit(1);
}

async function checkBanners() {
  console.log('\n📊 HOMEPAGE DIAGNOSTIC REPORT\n');
  console.log('='.repeat(70));

  try {
    // Connect
    console.log('\n1️⃣  Database Connection');
    console.log('-'.repeat(70));
    
    await mongoose.connect(process.env.MONGODB_URI, { 
      serverSelectionTimeoutMS: 5000 
    });
    console.log('✓ MongoDB connected successfully');

    // Get banners
    console.log('\n2️⃣  Banner Data in Database');
    console.log('-'.repeat(70));
    
    const allBanners = await Banner.find();
    const activeBanners = await Banner.find({ isActive: true });
    const desktopBanners = await Banner.find({ type: 'desktop', isActive: true });

    console.log(`Total banners: ${allBanners.length}`);
    console.log(`Active banners: ${activeBanners.length}`);
    console.log(`Active desktop banners: ${desktopBanners.length}`);

    if (desktopBanners.length === 0) {
      console.log('\n⚠️  WARNING: No active desktop banners found!');
      console.log('   This is why the homepage appears blank.');
      console.log('\n   Quick Fix: Add a desktop banner via admin panel');
    }

    // Check files
    console.log('\n3️⃣  Banner Files on Disk');
    console.log('-'.repeat(70));

    try {
      const files = await fs.readdir(UPLOAD_DIR);
      console.log(`Total files in ${UPLOAD_DIR}:`);
      console.log(`  ${files.length} files found`);
      
      if (files.length > 0) {
        console.log('\nFiles:');
        for (const file of files) {
          const stat = await fs.stat(path.join(UPLOAD_DIR, file));
          console.log(`  - ${file} (${(stat.size / 1024).toFixed(2)} KB)`);
        }
      }
    } catch (e) {
      console.log(`Directory not found or error: ${UPLOAD_DIR}`);
    }

    // Check database vs files
    console.log('\n4️⃣  Database vs Disk Consistency');
    console.log('-'.repeat(70));

    let missingFiles = 0;
    let valid = 0;

    for (const banner of allBanners) {
      if (!banner.filename) {
        console.log(`❌ ${banner._id}: No filename in database`);
        missingFiles++;
      } else {
        const filepath = path.join(UPLOAD_DIR, banner.filename);
        try {
          await fs.stat(filepath);
          console.log(`✓ ${banner.type}: ${banner.filename}`);
          valid++;
        } catch (e) {
          console.log(`❌ ${banner._id}: File missing (${banner.filename})`);
          missingFiles++;
        }
      }
    }

    console.log(`\nResult: ${valid} valid | ${missingFiles} issues`);

    // Recommendations
    console.log('\n5️⃣  Recommendations');
    console.log('-'.repeat(70));

    if (desktopBanners.length === 0) {
      console.log('\n🔴 PRIMARY ISSUE: No desktop banners configured');
      console.log('\nSteps to fix:');
      console.log('1. Log in to admin panel: https://omnyxglobal.in/admin');
      console.log('2. Go to Banners section');
      console.log('3. Upload a desktop banner image');
      console.log('4. Mark it as "Active" (isActive: true)');
      console.log('5. Wait 2-3 minutes for cache refresh');
      console.log('6. Visit homepage: https://omnyxglobal.in');
    }

    if (missingFiles > 0) {
      console.log('\n🟡 SECONDARY ISSUE: Some banner files are missing');
      console.log('   These should be re-uploaded via admin panel');
    }

    if (desktopBanners.length > 0 && missingFiles === 0) {
      console.log('\n✅ All checks passed! Banners are configured correctly.');
      console.log('   If homepage still shows blank:');
      console.log('   - Check browser console for errors');
      console.log('   - Verify API endpoint: https://omnyxglobal.in:3002/api/store/banners');
      console.log('   - Check CORS configuration');
      console.log('   - Clear browser cache (Ctrl+Shift+Delete)');
    }

    // API test command
    console.log('\n6️⃣  API Testing');
    console.log('-'.repeat(70));
    console.log('\nTest the banner API with:');
    console.log('  curl "https://omnyxglobal.in:3002/api/store/banners"');
    console.log('  or on production: https://omnyxglobal.in/api/store/banners');

    await mongoose.disconnect();
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error during diagnostic:', error.message);
    process.exit(1);
  }
}

checkBanners();
