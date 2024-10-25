const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const config = require('../config/config');
const User = require('../models/User');
const Article = require('../models/Article');
const Client = require('../models/Client');
const Inventory = require('../models/Inventory');
const { initializeOrUpdateInventory } = require('../controllers/inventoryController');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const migrateAndSeedAllModels = async () => {
    try {
        await mongoose.connect(config.DATABASE_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to the database.');

        // Clear existing data
        await User.deleteMany();
        await Article.deleteMany();
        await Client.deleteMany();
        await Inventory.deleteMany();

        // Seed superadmin
        const superAdminData = {
            username: 'superadmin',
            email: 'superadmin@example.com',
            password: 'SuperAdmin123!',
            passwordConfirm: 'SuperAdmin123!',
            role: 'superadmin'
        };
        const newSuperAdmin = await User.create(superAdminData);
        console.log('Superadmin account created successfully:', newSuperAdmin.email);

        // Seed admin
        await User.create({
            username: 'admin',
            email: 'admin@example.com',
            password: 'adminpassword',
            passwordConfirm: 'adminpassword',
            role: 'admin'
        });

        // Seed clients from CSV
        await seedClientsFromCSV('Liste Cliennt.csv');

        // Seed articles from CSV
        await seedArticlesFromCSV('Liste article SLD.csv');

        console.log('All models migrated and seeded successfully');
    } catch (error) {
        console.error('Error migrating and seeding models:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

const seedClientsFromCSV = (filename) => {
    return new Promise((resolve, reject) => {
        const clients = [];
        fs.createReadStream(path.join(__dirname, filename))
            .pipe(csv())
            .on('data', (row) => {
                clients.push({
                    codeClient: row['Code Client'],
                    intitule: row['Intitulé'],
                    tel1: row['Tél 1'],
                    tel2: row['Tél 2'],
                    profession: row['Profession'],
                    societe: row['Société'],
                    email: row['Mail'],
                    adresse: row['Adresse']
                });
            })
            .on('end', async () => {
                try {
                    await Client.insertMany(clients);
                    console.log(`${clients.length} clients seeded successfully`);
                    resolve();
                } catch (error) {
                    console.error('Error seeding clients:', error);
                    reject(error);
                }
            });
    });
};

const seedArticlesFromCSV = (filename) => {
    return new Promise((resolve, reject) => {
        const articles = [];
        fs.createReadStream(path.join(__dirname, filename))
            .pipe(csv())
            .on('data', (row) => {
                articles.push({
                    code: row['Code'],
                    codeABar: row['Code à Bar'],
                    designation: row['Désignation'],
                    stock: parseFloat(row['Stock']) || 0,
                    famille: row['Famille'],
                    marque: row['Marque'],
                    prixAchatHT: parseFloat(row['Prix Achat HT']) || 0,
                    pventeTTC: parseFloat(row['PventeTTC']) || 0,
                    pventePublicHT: parseFloat(row['Pvente Pub HT']) || 0
                });
            })
            .on('end', async () => {
                try {
                    await Article.insertMany(articles);
                    console.log(`${articles.length} articles seeded successfully`);
                    
                    // Initialize inventory for seeded articles
                    for (const article of articles) {
                        await initializeOrUpdateInventory(article._id, article.stock);
                    }
                    console.log('Inventory initialized for all articles');
                    resolve();
                } catch (error) {
                    console.error('Error seeding articles:', error);
                    reject(error);
                }
            });
    });
};

migrateAndSeedAllModels();
