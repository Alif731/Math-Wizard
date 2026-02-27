const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

dotenv.config();

connectDB().then(() => {
  require('./utils/seeder')();
});

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // Adjust to your frontend port
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const learningRoutes = require('./routes/learningRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/learning', learningRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
