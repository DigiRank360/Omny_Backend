#!/usr/bin/env node
import 'dotenv/config';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs/promises';
import Banner from '../models/Banner.js';

const UPLOAD_DIR = './public/uploads/banners';

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Get all banners
    const allBanners = await Banner.find();
    console.log(`\nFound ${allBanners.length} banners in database`);

    if (allBanners.length === 0) {
      console.log('No banners found. Database is clean.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Check each banner
    let broken = 0;
    let valid = 0;
    const issues = [];

    for (const banner of allBanners) {
      console.log(`\n📋 Banner: ${banner._id}`);
      console.log(`   Type: ${banner.type}`);
      console.log(`   Image URL: ${banner.imageUrl}`);
      console.log(`   Filename: ${banner.filename || '(not set)'}`);
      console.log(`   Active: ${banner.isActive}`);

      // Check if file exists
      if (!banner.filename) {
        console.log('   ❌ ERROR: No filename stored!');
        broken++;
        issues.push({
          id: banner._id,
          problem: 'Missing filename',
          banner
        });
        continue;
      }

      const filepath = path.join(UPLOAD_DIR, banner.filename);
      try {
        await fs.stat(filepath);
        console.log(`   ✓ File exists: ${filepath}`);
        valid++;
      } catch (e) {
        console.log(`   ❌ File missing: ${filepath}`);
        broken++;
        issues.push({
          id: banner._id,
          problem: 'File not found on disk',
          filepath,
          banner
        });
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Summary: ${valid} valid | ${broken} broken`);
    console.log(`${'='.repeat(60)}`);

    if (issues.length > 0) {
      console.log('\n⚠️  Issues found:');
      issues.forEach((issue, i) => {
        console.log(`\n${i + 1}. ${issue.problem}`);
        console.log(`   Banner ID: ${issue.id}`);
        if (issue.filepath) console.log(`   Expected file: ${issue.filepath}`);
      });

      console.log('\n📝 Recommendations:');
      console.log('1. Upload new banner images via admin panel');
      console.log('2. Verify banners are marked as isActive: true');
      console.log('3. Check API response: curl https://omnyxglobal.in:3002/api/store/banners');
    }

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    process.exit(broken > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
