const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const Article = require('../models/Article');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    throw new AppError('Start date and end date are required', 400);
  }
  if (new Date(startDate) > new Date(endDate)) {
    throw new AppError('Start date must be before end date', 400);
  }
};

exports.getSalesReport = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  validateDateRange(startDate, endDate);
  const sales = await Sale.find({
    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
  }).populate('client').populate('items.article');

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);

  res.status(200).json({
    status: 'success',
    data: { sales, totalSales }
  });
});

exports.getInventoryReport = catchAsync(async (req, res, next) => {
  const inventory = await Inventory.find().populate('article');
  const lowStock = inventory.filter(item => item.quantity < 10);

  res.status(200).json({
    status: 'success',
    data: { inventory, lowStock }
  });
});

exports.getRevenueReport = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  validateDateRange(startDate, endDate);
  const sales = await Sale.find({
    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
  });

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const dailyRevenue = sales.reduce((acc, sale) => {
    const date = sale.date.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + sale.total;
    return acc;
  }, {});

  res.status(200).json({
    status: 'success',
    data: { totalRevenue, dailyRevenue }
  });
});

exports.getProductPerformanceReport = catchAsync(async (req, res, next) => {
  const productPerformance = await Sale.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.article',
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);
  await Article.populate(productPerformance, { path: '_id' });
  res.status(200).json({
    status: 'success',
    data: { productPerformance }
  });
});
