const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

connectDB().then(() => {
  require('./utils/seeder')();
});

const app = express();

app.use(cors());
app.use(express.json());

const learningRoutes = require('./routes/learningRoutes');

app.use('/api', learningRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
