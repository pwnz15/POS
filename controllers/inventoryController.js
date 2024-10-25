const Inventory = require('../models/Inventory');
const Article = require('../models/Article');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');


exports.getAllInventory = catchAsync(async (req, res, next) => {
  const inventory = await Inventory.find().populate('article');
  res.status(200).json({
    status: 'success',
    results: inventory.length,
    data: { inventory }
  });
});

exports.getInventoryItem = catchAsync(async (req, res, next) => {
  const item = await Inventory.findById(req.params.id).populate('article');
  if (!item) {
    return next(new AppError('No inventory item found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { item }
  });
});

exports.updateInventory = catchAsync(async (req, res, next) => {
  const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('article');
  if (!item) {
    return next(new AppError('No inventory item found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { item }
  });
});

exports.getLowStockItems = catchAsync(async (req, res, next) => {
  const threshold = req.query.threshold || 10;
  const lowStockItems = await Inventory.find({ quantity: { $lt: threshold } }).populate('article');
  res.status(200).json({
    status: 'success',
    results: lowStockItems.length,
    data: { lowStockItems }
  });
});

// Add these methods to inventoryController.js
exports.getInventoryForArticle = catchAsync(async (req, res, next) => {
  const inventory = await Inventory.findOne({ article: req.params.articleId }).populate('article');
  if (!inventory) {
    return next(new AppError('No inventory found for this article', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { inventory }
  });
});



exports.initializeOrUpdateInventory = async (articleId, quantity = 0, session = null) => {
  try {
    const inventory = await Inventory.findOneAndUpdate(
      { article: articleId },
      { $set: { quantity: quantity } },
      { upsert: true, new: true, runValidators: true, session }
    );
    return inventory;
  } catch (error) {
    console.error('Error in initializeOrUpdateInventory:', error);
    throw error;
  }
};
