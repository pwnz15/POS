const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Article = require('../models/Article');
const Client = require('../models/Client');

dotenv.config({ path: '../config.env' });

mongoose.connect(process.env.DATABASE_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('DB connection successful!'))
.catch((err) => console.error('DB connection error:', err));

const seedDatabase = async () => {
    try {
        // Clear existing data
        await User.deleteMany();
        await Article.deleteMany();
        await Client.deleteMany();

        // Create admin user
        await User.create({
            username: 'admin',
            email: 'admin@example.com',
            password: 'adminpassword',
            role: 'admin'
        });

        // Create sample articles
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

        // Create sample clients
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
        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
