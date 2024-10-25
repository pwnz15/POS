const Sale = require('../models/Sale');
const Article = require('../models/Article');
const Inventory = require('../models/Inventory');
const PosTransaction = require('../models/PosTransaction');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createQuickSale = catchAsync(async (req, res, next) => {
  // Implementation similar to saleController.createSale
  // Add PosTransaction creation
});

exports.getArticleByBarcode = catchAsync(async (req, res, next) => {
  const article = await Article.findOne({ barcode: req.params.barcode });
  if (!article) {
    return next(new AppError('No article found with that barcode', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { article }
  });
});

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

exports.getLowStockItems = catchAsync(async (req, res, next) => {
  const threshold = req.query.threshold || 10;
  const lowStockItems = await Inventory.find({ quantity: { $lt: threshold } }).populate('article');
  res.status(200).json({
    status: 'success',
    results: lowStockItems.length,
    data: { lowStockItems }
  });
});

exports.getDailySales = catchAsync(async (req, res, next) => {
  const { date } = req.query;
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const dailySales = await PosTransaction.find({
    transactionDate: { $gte: startOfDay, $lte: endOfDay }
  }).populate('saleId');

  res.status(200).json({
    status: 'success',
    results: dailySales.length,
    data: { dailySales }
  });
});
