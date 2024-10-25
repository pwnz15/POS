const express = require('express');
const posController = require('../controllers/posController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Protect all POS routes

router.post('/sale', posController.createQuickSale);
router.get('/article/:barcode', posController.getArticleByBarcode);
router.get('/inventory/:articleId', posController.getInventoryForArticle);
router.get('/low-stock', restrictTo('admin', 'manager', 'supervisor', 'accountant'), posController.getLowStockItems);
router.get('/daily-sales', restrictTo('admin', 'manager', 'supervisor', 'accountant'), posController.getDailySales);

module.exports = router;
