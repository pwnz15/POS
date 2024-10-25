const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Article = require('../models/Article');
const Client = require('../models/Client');

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seedAll = async () => {
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

        // Clear existing data
        await User.deleteMany();
        await Article.deleteMany();
        await Client.deleteMany();

        // Seed superadmin
        const superAdminData = {
            username: 'superadmin',
            email: 'superadmin@example.com',
            password: 'SuperAdmin123!',
            passwordConfirm: 'SuperAdmin123!', // Add this line
            role: 'superadmin'
        };

        const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
        console.log('existingSuperAdmin:', existingSuperAdmin);
        if (existingSuperAdmin) {
            console.log('A superadmin account already exists.');
        } else {
            const newSuperAdmin = await User.create(superAdminData);
            newSuperAdmin.createRefreshToken();
            await newSuperAdmin.save();
            console.log('Superadmin account created successfully:', newSuperAdmin.email);
        }

        // Seed admin
        await User.create({
            username: 'admin',
            email: 'admin@example.com',
            password: 'adminpassword',
            passwordConfirm: 'adminpassword',
            role: 'admin'
        });

        // Seed sample articles
        await Article.create([
            {
                code: 'ART001',
                designation: 'Sample Article 1',
                stock: 100,
                prixAchatHT: 10,
                pventeTTC: 15
            },
            {
                code: 'ART002',
                designation: 'Sample Article 2',
                stock: 50,
                prixAchatHT: 20,
                pventeTTC: 30
            }
        ]);

        // Seed sample clients
        await Client.create([
            {
                codeClient: 'CLI001',
                intitule: 'Sample Client 1',
                tel1: '12345678'
            },
            {
                codeClient: 'CLI002',
                intitule: 'Sample Client 2',
                tel1: '87654321'
            }
        ]);

        console.log('Database seeded successfully');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

seedAll();
