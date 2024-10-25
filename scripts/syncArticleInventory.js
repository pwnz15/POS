const mongoose = require('mongoose');
const Article = require('../models/Article');
const Inventory = require('../models/Inventory');
const config = require('../config/config');

const syncArticleInventory = async () => {
    try {
        await mongoose.connect(config.DATABASE_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to database.');

        const articles = await Article.find();
        console.log(`Found ${articles.length} articles.`);

        for (const article of articles) {
            const inventory = await Inventory.findOne({ article: article._id });
            if (inventory) {
                if (article.stock !== inventory.quantity) {
                    article.stock = inventory.quantity;
                    await article.save();
                    console.log(`Updated stock for article: ${article.designation}`);
                }
            } else {
                await Inventory.create({ article: article._id, quantity: article.stock });
                console.log(`Created inventory for article: ${article.designation}`);
            }
        }

        console.log('Article-Inventory synchronization completed');
    } catch (error) {
        console.error('Error synchronizing article-inventory:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

module.exports = syncArticleInventory;