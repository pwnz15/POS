const express = require('express');
const reportsController = require('../controllers/reportsController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/sales', restrictTo('admin', 'manager', 'supervisor', 'accountant'), reportsController.getSalesReport);
router.get('/inventory', restrictTo('admin', 'manager', 'supervisor', 'accountant'), reportsController.getInventoryReport);
router.get('/revenue', restrictTo('admin', 'manager', 'supervisor', 'accountant'), reportsController.getRevenueReport);
router.get('/product-performance', restrictTo('admin', 'manager', 'supervisor', 'accountant'), reportsController.getProductPerformanceReport);

module.exports = router;
