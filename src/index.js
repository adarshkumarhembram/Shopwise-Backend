require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 4000;

(async () => {
  await connectDB(process.env.MONGO_URI);
  const server = http.createServer(app);
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})();
