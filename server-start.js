const mongoose = require('mongoose');
const app = require('./server');
const config = require('./config/config');

const startServer = async () => {
  console.log('Starting server...');
  try {
    await mongoose.connect(config.DATABASE_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const PORT = config.PORT;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = startServer;
