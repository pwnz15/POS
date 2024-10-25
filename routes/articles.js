const express = require('express');
const articleController = require('../controllers/articleController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Protect all article routes

router.route('/')
  .get(articleController.getAllArticles)
  .post(restrictTo('admin', 'superadmin'), articleController.createArticle);

router.route('/:id')
  .get(articleController.getArticle)
  .patch(restrictTo('admin', 'superadmin'), articleController.updateArticle)
  .delete(restrictTo('admin', 'superadmin'), articleController.deleteArticle);

router.get('/suppliers/:supplierId', articleController.getArticlesBySupplier);



module.exports = router;
