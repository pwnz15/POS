const Article = require('../models/Article');
const Supplier = require('../models/Supplier');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { validateArticle } = require('../middleware/validation');
const mongoose = require('mongoose');
const inventoryController = require('./inventoryController');

exports.getAllArticles = catchAsync(async (req, res, next) => {
  logger.info('Fetching all articles');
  const articles = await Article.find().populate('supplier', 'name');
  logger.info(`Retrieved ${articles.length} articles`);
  res.status(200).json({
    status: 'success',
    results: articles.length,
    data: { articles }
  });
});

exports.getArticle = catchAsync(async (req, res, next) => {
  logger.info(`Fetching article with id: ${req.params.id}`);
  let article;
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    article = await Article.findById(req.params.id).populate('supplier', 'name');
  } else {
    article = await Article.findOne({ code: req.params.id }).populate('supplier', 'name');
  }
  if (!article) {
    logger.warn(`No article found with id or code: ${req.params.id}`);
    return next(new AppError('No article found with that ID or code', 404));
  }
  logger.info(`Retrieved article: ${article.designation}`);
  res.status(200).json({
    status: 'success',
    data: { article }
  });
});

exports.createArticle = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    logger.info('Creating new article');
    
    // Check if supplier exists
    if (req.body.supplier) {
      const supplierExists = await Supplier.findById(req.body.supplier).session(session);
      if (!supplierExists) {
        throw new AppError('Supplier not found', 404);
      }
    }
    
    const newArticle = await Article.create([req.body], { session });
    await inventoryController.initializeOrUpdateInventory(newArticle[0]._id, newArticle[0].stock, session);
    
    await session.commitTransaction();
    session.endSession();

    logger.info(`Article created successfully: ${newArticle[0].designation}`);
    res.status(201).json({
      status: 'success',
      data: { article: newArticle[0] }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error(`Error creating article: ${error.message}`);
    return next(new AppError('Error creating article', 400));
  }
});

exports.updateArticle = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { error } = validateArticle(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    // Check if supplier exists if it's being updated
    if (req.body.supplier) {
      const supplierExists = await Supplier.findById(req.body.supplier).session(session);
      if (!supplierExists) {
        throw new AppError('Supplier not found', 404);
      }
    }

    logger.info(`Updating article with id or code: ${req.params.id}`);
    let article;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      article = await Article.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        session
      });
    } else {
      article = await Article.findOneAndUpdate({ code: req.params.id }, req.body, {
        new: true,
        runValidators: true,
        session
      });
    }
    if (!article) {
      throw new AppError('No article found with that ID or code', 404);
    }
    
    // Update inventory if stock has changed
    if ('stock' in req.body) {
      await inventoryController.initializeOrUpdateInventory(article._id, article.stock, session);
    }

    await session.commitTransaction();
    logger.info(`Article updated successfully: ${article.designation}`);
    res.status(200).json({
      status: 'success',
      data: { article }
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error updating article: ${error.message}`);
    return next(error);
  } finally {
    session.endSession();
  }
});

exports.deleteArticle = catchAsync(async (req, res, next) => {
  logger.info(`Deleting article with id or code: ${req.params.id}`);
  let article;
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    article = await Article.findByIdAndDelete(req.params.id);
  } else {
    article = await Article.findOneAndDelete({ code: req.params.id });
  }
  if (!article) {
    logger.warn(`No article found with id or code: ${req.params.id}`);
    return next(new AppError('No article found with that ID or code', 404));
  }
  logger.info(`Article deleted successfully: ${article.designation}`);
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getArticleByBarcode = catchAsync(async (req, res, next) => {
  logger.info(`Fetching article with barcode: ${req.params.barcode}`);
  const article = await Article.findOne({ codeABar: req.params.barcode });
  if (!article) {
    logger.warn(`No article found with barcode: ${req.params.barcode}`);
    return next(new AppError('No article found with that barcode', 404));
  }
  logger.info(`Retrieved article: ${article.name}`);
  res.status(200).json({
    status: 'success',
    data: { article }
  });
});

// New function to get articles by supplier
exports.getArticlesBySupplier = catchAsync(async (req, res, next) => {
  const supplierId = req.params.supplierId;
  
  logger.info(`Fetching articles for supplier: ${supplierId}`);
  
  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    logger.warn(`No supplier found with id: ${supplierId}`);
    return next(new AppError('No supplier found with that ID', 404));
  }
  
  const articles = await Article.find({ supplier: supplierId });
  
  logger.info(`Retrieved ${articles.length} articles for supplier: ${supplier.name}`);
  
  res.status(200).json({
    status: 'success',
    results: articles.length,
    data: { 
      supplier: supplier.name,
      articles 
    }
  });
});
