const paginate = async (model, page, limit) => {
  const skip = (page - 1) * limit;
  const data = await model.find().skip(skip).limit(limit);
  const total = await model.countDocuments();
  return {
    data,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalItems: total
  };
};

module.exports = paginate;
