require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Movie server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
