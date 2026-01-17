import User from '../models/User.js';

export const ensureSuperAdmin = async () => {
  try {
    const existing = await User.findOne({ role: 'Super Admin' });
    if (existing) {
      console.log('👑 Super Admin exists:', existing.email);
      return;
    }

    const email = process.env.SUPERADMIN_EMAIL;
    const password = process.env.SUPERADMIN_PASSWORD;
    const firstName = process.env.SUPERADMIN_FIRSTNAME || 'Super';
    const lastName = process.env.SUPERADMIN_LASTNAME || 'Admin';
    const phone = process.env.SUPERADMIN_PHONE || '0000000000';

    if (!email || !password) {
      console.warn('⚠️  SUPERADMIN_EMAIL/PASSWORD not set. Skipping Super Admin bootstrap.');
      return;
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: 'Super Admin',
      isActive: true
    });

    console.log('✅ Super Admin created:', user.email);
  } catch (err) {
    console.error('❌ Failed to bootstrap Super Admin:', err.message);
  }
};
