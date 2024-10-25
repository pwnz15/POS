const express = require('express');
const deliveryController = require('../controllers/deliveryController');
const  protect  = require('../middleware/auth').protect;

const router = express.Router();

// Apply the protect middleware to all routes
router.use(protect);

router.route('/')
  .get(deliveryController.getAllDeliveries)
  .post(deliveryController.createDelivery);

router.route('/:id')
  .get(deliveryController.getDelivery)
  .patch(deliveryController.updateDelivery)
  .delete(deliveryController.deleteDelivery);

module.exports = router;
