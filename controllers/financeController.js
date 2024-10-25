const Sale = require('../models/Sale');
const catchAsync = require('../utils/catchAsync');

exports.getDailyRevenue = catchAsync(async (req, res, next) => {
    const { startDate, endDate } = req.query;
    const sales = await Sale.find({
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });

    const dailyRevenue = sales.reduce((acc, sale) => {
        const date = sale.date.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + sale.total;
        return acc;
    }, {});

    res.status(200).json({
        status: 'success',
        data: { dailyRevenue }
    });
});

exports.getProfitMargin = catchAsync(async (req, res, next) => {
    const sales = await Sale.find().populate('items.article');

    const profitMargin = sales.reduce((acc, sale) => {
        const saleProfit = sale.items.reduce((itemAcc, item) => {
            const cost = item.article.prixAchatHT * item.quantity;
            const revenue = item.price * item.quantity;
            return itemAcc + (revenue - cost);
        }, 0);
        return acc + saleProfit;
    }, 0);

    const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
    const profitMarginPercentage = (profitMargin / totalRevenue) * 100;

    res.status(200).json({
        status: 'success',
        data: {
            profitMargin,
            profitMarginPercentage: profitMarginPercentage.toFixed(2) + '%'
        }
    });
});
