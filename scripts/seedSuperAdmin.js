const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seedSuperAdmin = async () => {
  try {
    const DATABASE_URI = process.env.DATABASE_URI;
    if (!DATABASE_URI) {
      throw new Error('DATABASE_URI is not defined in the environment variables');
    }

    await mongoose.connect(DATABASE_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to the database.');

    const superAdminData = {
      username: 'superadmin',
      email: 'superadmin@example.com',
      password: 'SuperAdmin123!',
      passwordConfirm: 'SuperAdmin123!',
      role: 'superadmin'
    };

    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });

    if (existingSuperAdmin) {
      console.log('A superadmin account already exists.');
    } else {
      const newSuperAdmin = await User.create(superAdminData);
      console.log('Superadmin account created successfully:', newSuperAdmin.email);
    }

  } catch (error) {
    console.error('Error seeding superadmin:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

seedSuperAdmin();
