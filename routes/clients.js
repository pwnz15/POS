const express = require('express');
const clientController = require('../controllers/clientController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Protect all client routes

router.route('/')
  .get(clientController.getAllClients)
  .post(restrictTo('admin', 'superadmin'), clientController.createClient);

router.route('/:id')
  .get(clientController.getClient)
  .patch(restrictTo('admin', 'superadmin'), clientController.updateClient)
  .delete(restrictTo('admin', 'superadmin'), clientController.deleteClient);

module.exports = router;
