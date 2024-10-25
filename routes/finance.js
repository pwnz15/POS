const express = require('express');
const financeController = require('../controllers/financeController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/daily-revenue', 
    restrictTo('admin', 'manager', 'supervisor', 'accountant'), 
    financeController.getDailyRevenue
);

router.get('/profit-margin', 
    restrictTo('admin', 'manager', 'supervisor', 'accountant'), 
    financeController.getProfitMargin
);

module.exports = router;
