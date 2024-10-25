const express = require('express');
const chauffeurController = require('../controllers/chauffeurController');
const { protect, restrictTo } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(chauffeurController.getAllChauffeurs)
    .post(restrictTo('admin', 'superadmin'), chauffeurController.createChauffeur);

router
    .route('/:id')
    .get(chauffeurController.getChauffeur)
    .patch(restrictTo('admin', 'superadmin'), chauffeurController.updateChauffeur)
    .delete(restrictTo('admin', 'superadmin'), chauffeurController.deleteChauffeur);

module.exports = router;