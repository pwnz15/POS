const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Article = require('../models/Article');
const path = require('path');
const Inventory = require('../models/Inventory');
const { initializeOrUpdateInventory } = require('../controllers/inventoryController');
const config = require('../config/config');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const syncInventory = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(config.DATABASE_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to database.');

        const articles = await Article.find();
        console.log(`Found ${articles.length} articles.`);

        for (const article of articles) {
            await initializeOrUpdateInventory(article._id, article.stock);
            console.log(`Synchronized inventory for article: ${article.designation}`);
        }

        console.log('Inventory synchronization completed');
    } catch (error) {
        console.error('Error synchronizing inventory:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

syncInventory().then(() => process.exit(0)).catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
