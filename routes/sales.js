const express = require('express');
const saleController = require('../controllers/saleController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Protect all sale routes

router.route('/')
  .get(restrictTo('admin', 'manager', 'supervisor', 'accountant'), saleController.getAllSales)
  .post(saleController.createSale);

router.route('/:id')
  .get(saleController.getSale)
  .patch(restrictTo('admin', 'manager', 'supervisor', 'accountant'), saleController.updateSale)
  .delete(restrictTo('admin', 'manager', 'supervisor', 'accountant'), saleController.deleteSale);

module.exports = router;
