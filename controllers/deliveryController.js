const Delivery = require('../models/Delivery');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Chauffeur = require('../models/Chauffeur');

exports.getAllDeliveries = catchAsync(async (req, res, next) => {
  const deliveries = await Delivery.find().populate('sale').populate('chauffeur');
  res.status(200).json({
    status: 'success',
    results: deliveries.length,
    data: { deliveries }
  });
});

exports.getDelivery = catchAsync(async (req, res, next) => {
  const delivery = await Delivery.findById(req.params.id).populate('sale').populate('chauffeur');
  if (!delivery) {
    return next(new AppError('No delivery found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { delivery }
  });
});

exports.createDelivery = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { sale: saleId, chauffeur: chauffeurId, license, ...deliveryData } = req.body;
    const sale = await Sale.findById(saleId).session(session);
    if (!sale) {
      throw new AppError('No sale found with that ID', 404);
    }

    const chauffeur = await Chauffeur.findById(chauffeurId).session(session);
    if (!chauffeur) {
      throw new AppError('No chauffeur found with that ID', 404);
    }

    const newDelivery = await Delivery.create([{
      sale: saleId,
      chauffeur: chauffeurId,
      license,
      ...deliveryData
    }], { session });

    sale.delivery = newDelivery[0]._id;
    await sale.save({ session });

    await session.commitTransaction();
    res.status(201).json({
      status: 'success',
      data: { delivery: newDelivery[0] }
    });
  } catch (error) {
    await session.abortTransaction();
    return next(error);
  } finally {
    session.endSession();
  }
});

exports.updateDelivery = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updatedDelivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      {
        chauffeur: req.body.chauffeur,
        license: req.body.license,
        status: req.body.status,
        ...req.body
      },
      { new: true, runValidators: true, session }
    );

    if (!updatedDelivery) {
      throw new AppError('No delivery found with that ID', 404);
    }

    await session.commitTransaction();
    res.status(200).json({
      status: 'success',
      data: { delivery: updatedDelivery }
    });
  } catch (error) {
    await session.abortTransaction();
    return next(error);
  } finally {
    session.endSession();
  }
});

exports.deleteDelivery = catchAsync(async (req, res, next) => {
  const delivery = await Delivery.findByIdAndDelete(req.params.id);
  if (!delivery) {
    return next(new AppError('No delivery found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});
