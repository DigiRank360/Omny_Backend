import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import app from '../app.js';
import { BANNER_UPLOAD_DIR } from '../config/paths.js';
import Banner from '../models/Banner.js';
import { createBanner, deleteBanner } from '../controllers/bannerController.js';

test('serves uploads from the backend directory and returns 404 for missing files', async () => {
  const filename = `${randomUUID()}.jpeg`;
  const filepath = path.join(BANNER_UPLOAD_DIR, filename);
  const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
  await mkdir(BANNER_UPLOAD_DIR, { recursive: true });
  await writeFile(filepath, bytes);
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise(resolve => server.once('listening', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const response = await fetch(`${origin}/uploads/banners/${filename}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^image\/jpeg\b/);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);

    const missing = await fetch(`${origin}/uploads/banners/missing-${filename}`, {
      headers: { Accept: 'text/html' },
    });

    assert.equal(missing.status, 404);
    assert.doesNotMatch(missing.headers.get('content-type'), /text\/html/);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await unlink(filepath);
  }
});

test('uploads and deletes banners in the directory served by the app', async () => {
  const originalSave = Banner.prototype.save;
  const originalFindByIdAndDelete = Banner.findByIdAndDelete;
  const bytes = Buffer.from('local banner test');
  let savedBanner;
  let status;
  let body;
  const res = {
    status(code) { status = code; return this; },
    json(value) { body = value; return this; },
  };
  Banner.prototype.save = async function () { savedBanner = this; return this; };
  Banner.findByIdAndDelete = async () => savedBanner;
  try {
    await createBanner({ file: { originalname: 'banner.jpeg', buffer: bytes }, body: { type: 'desktop' } }, res);
    assert.equal(status, 201);
    assert.equal(body.imageUrl, `/uploads/banners/${body.filename}`);
    const filepath = path.join(BANNER_UPLOAD_DIR, body.filename);
    assert.deepEqual(await readFile(filepath), bytes);
    await deleteBanner({ params: { id: String(savedBanner._id) } }, res);
    assert.equal(body.success, true);
    await assert.rejects(stat(filepath), { code: 'ENOENT' });
  } finally {
    Banner.prototype.save = originalSave;
    Banner.findByIdAndDelete = originalFindByIdAndDelete;
    if (savedBanner) await unlink(path.join(BANNER_UPLOAD_DIR, savedBanner.filename)).catch(error => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
});
