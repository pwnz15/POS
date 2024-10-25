const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Protect all inventory routes

router.route('/')
  .get(inventoryController.getAllInventory);

router.route('/:id')
  .get(inventoryController.getInventoryItem)
  .patch(restrictTo('admin', 'superadmin'), inventoryController.updateInventory);

router.get('/low-stock', restrictTo('admin', 'superadmin'), inventoryController.getLowStockItems);

module.exports = router;
