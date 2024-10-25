const express = require('express');
const supplierController = require('../controllers/supplierController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Protect all supplier routes

router.route('/')
  .get(supplierController.getAllSuppliers)
  .post(restrictTo('admin', 'manager', 'supervisor', 'accountant'), supplierController.createSupplier);

router.route('/:id')
  .get(supplierController.getSupplier)
  .patch(restrictTo('admin', 'manager', 'supervisor', 'accountant'), supplierController.updateSupplier)
  .delete(restrictTo('admin', 'manager', 'supervisor', 'accountant'), supplierController.deleteSupplier);

module.exports = router;
