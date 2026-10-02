import Admin from '../models/Admin.js';
export default async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL.toLowerCase();
  if (!(await Admin.findOne({ email }))) {
    await Admin.create({ email, password: process.env.ADMIN_PASSWORD });
    console.log('Default admin created:', email);
  }
}
