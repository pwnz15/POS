const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Article = require('../models/Article');
const Client = require('../models/Client');
const mongoose = require('mongoose');
const Delivery = require('../models/Delivery');

exports.getAllSales = catchAsync(async (req, res, next) => {
  const sales = await Sale.find().populate('client').populate('items.article');
  res.status(200).json({
    status: 'success',
    results: sales.length,
    data: { sales }
  });
});

exports.getSale = catchAsync(async (req, res, next) => {
  const sale = await Sale.findById(req.params.id)
    .populate('client')
    .populate('items.article')
    .populate({
      path: 'delivery',
      populate: { path: 'chauffeur' }
    });
  if (!sale) {
    return next(new AppError('No sale found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { sale }
  });
});

exports.createSale = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const clientExists = await Client.findById(req.body.client).session(session);
    if (!clientExists) {
      throw new AppError('Client not found', 404);
    }

    let insufficientStockItems = [];
    let saleItems = [];

    // Check inventory and prepare sale items
    for (let item of req.body.items) {
      const inventory = await Inventory.findOne({ article: item.article }).session(session);
      const article = await Article.findById(item.article).session(session);

      if (!inventory || inventory.quantity < item.quantity) {
        insufficientStockItems.push({
          article: article ? article.designation : 'Unknown Article',
          requested: item.quantity,
          available: inventory ? inventory.quantity : 0
        });
      } else {
        saleItems.push(item);
      }
    }

    if (saleItems.length === 0) {
      throw new AppError(`Insufficient stock for items: ${insufficientStockItems.map(item => item.article).join(', ')}`, 400);
    }

    const saleData = { ...req.body, items: saleItems };

    // Handle delivery
    if (req.body.deliveryType === 'Delivery') {
      if (!req.body.chauffeur || !req.body.license) {
        throw new AppError('Chauffeur and license are required for delivery', 400);
      }
      const delivery = await Delivery.create([{
        chauffeur: req.body.chauffeur,
        license: req.body.license,
        status: 'pending',
        deliveryDate: req.body.deliveryDate || new Date()
      }], { session });
      saleData.delivery = delivery[0]._id;
    }

    const newSale = await Sale.create([saleData], { session });

    // Update inventory and article stock
    for (let item of newSale[0].items) {
      await Inventory.findOneAndUpdate(
        { article: item.article },
        { $inc: { quantity: -item.quantity } },
        { new: true, session }
      );

      await Article.findByIdAndUpdate(
        item.article,
        { $inc: { stock: -item.quantity } },
        { new: true, session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      status: 'success',
      data: {
        sale: newSale[0],
        insufficientStockItems: insufficientStockItems.length > 0 ? insufficientStockItems : undefined
      }
    });
  } catch (error) {
    await session.abortTransaction();
    return next(new AppError(error.message, 400));
  } finally {
    session.endSession();
  }
});

exports.updateSale = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const oldSale = await Sale.findById(req.params.id).populate('items.article').populate('delivery');
    if (!oldSale) {
      return next(new AppError('No sale found with that ID', 404));
    }

    // Revert old inventory changes
    for (const oldItem of oldSale.items) {
      await Inventory.findOneAndUpdate(
        { article: oldItem.article._id },
        { $inc: { quantity: oldItem.quantity } },
        { session }
      );
      await Article.findByIdAndUpdate(
        oldItem.article._id,
        { $inc: { stock: oldItem.quantity } },
        { session }
      );
    }

    // Check inventory for new items
    let insufficientStockItems = [];
    let updatedItems = [];

    for (let item of req.body.items) {
      const inventory = await Inventory.findOne({ article: item.article }).session(session);
      const article = await Article.findById(item.article).session(session);

      if (!inventory || inventory.quantity < item.quantity) {
        insufficientStockItems.push({
          article: article ? article.designation : 'Unknown Article',
          requested: item.quantity,
          available: inventory ? inventory.quantity : 0
        });
      } else {
        updatedItems.push(item);
      }
    }

    if (updatedItems.length === 0) {
      throw new AppError(`Insufficient stock for items: ${insufficientStockItems.map(item => item.article).join(', ')}`, 400);
    }

    const saleData = { ...req.body, items: updatedItems };

    // Handle delivery updates
    if (req.body.deliveryType === 'Delivery') {
      if (!req.body.chauffeur || !req.body.license) {
        throw new AppError('Chauffeur and license are required for delivery', 400);
      }
      
      if (oldSale.delivery) {
        // Update existing delivery
        await Delivery.findByIdAndUpdate(oldSale.delivery._id, {
          chauffeur: req.body.chauffeur,
          license: req.body.license,
          deliveryDate: req.body.deliveryDate || new Date(),
          status: 'pending'
        }, { session });
      } else {
        // Create new delivery
        const newDelivery = await Delivery.create([{
          sale: oldSale._id,
          chauffeur: req.body.chauffeur,
          license: req.body.license,
          status: 'pending',
          deliveryDate: req.body.deliveryDate || new Date()
        }], { session });
        saleData.delivery = newDelivery[0]._id;
      }
    } else if (oldSale.delivery) {
      // Remove delivery if type changed from Delivery to something else
      await Delivery.findByIdAndDelete(oldSale.delivery._id, { session });
      saleData.delivery = null;
    }

    // Update the sale
    const updatedSale = await Sale.findByIdAndUpdate(
      req.params.id,
      saleData,
      { new: true, runValidators: true, session }
    ).populate('client').populate('items.article').populate('delivery');

    // Apply new inventory changes
    for (const newItem of updatedSale.items) {
      await Inventory.findOneAndUpdate(
        { article: newItem.article._id },
        { $inc: { quantity: -newItem.quantity } },
        { session }
      );
      await Article.findByIdAndUpdate(
        newItem.article._id,
        { $inc: { stock: -newItem.quantity } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: 'success',
      data: { 
        sale: updatedSale,
        insufficientStockItems: insufficientStockItems.length > 0 ? insufficientStockItems : undefined
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(new AppError(error.message, 400));
  }
});

exports.deleteSale = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sale = await Sale.findById(req.params.id)
      .populate('items.article')
      .populate('delivery')
      .session(session);

    if (!sale) {
      return next(new AppError('No sale found with that ID', 404));
    }

    // Update inventory and article stock
    for (const item of sale.items) {
      await Inventory.findOneAndUpdate(
        { article: item.article._id },
        { $inc: { quantity: item.quantity } },
        { session }
      );

      await Article.findByIdAndUpdate(
        item.article._id,
        { $inc: { stock: item.quantity } },
        { session }
      );
    }

    // Handle related delivery
    if (sale.delivery) {
      await Delivery.findByIdAndUpdate(
        sale.delivery._id,
        { status: 'cancelled', sale: null },
        { session }
      );
    }

    // Delete the sale
    await Sale.findByIdAndDelete(req.params.id).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(new AppError(error.message, 400));
  }
});
