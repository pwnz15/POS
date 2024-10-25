const Chauffeur = require('../models/Chauffeur');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllChauffeurs = catchAsync(async (req, res, next) => {
  const chauffeurs = await Chauffeur.find();
  res.status(200).json({
    status: 'success',
    results: chauffeurs.length,
    data: { chauffeurs }
  });
});

exports.getChauffeur = catchAsync(async (req, res, next) => {
  const chauffeur = await Chauffeur.findById(req.params.id);
  if (!chauffeur) {
    return next(new AppError('No chauffeur found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { chauffeur }
  });
});

exports.createChauffeur = catchAsync(async (req, res, next) => {
  const newChauffeur = await Chauffeur.create(req.body);
  res.status(201).json({
    status: 'success',
    data: { chauffeur: newChauffeur }
  });
});

exports.updateChauffeur = catchAsync(async (req, res, next) => {
  const chauffeur = await Chauffeur.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!chauffeur) {
    return next(new AppError('No chauffeur found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { chauffeur }
  });
});

exports.deleteChauffeur = catchAsync(async (req, res, next) => {
  const chauffeur = await Chauffeur.findByIdAndDelete(req.params.id);
  if (!chauffeur) {
    return next(new AppError('No chauffeur found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});
