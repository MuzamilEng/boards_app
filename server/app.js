const express = require('express');
const app = express();

require('dotenv').config({ path: '.env' });
const connectDB = require('./db/connect');
const cors = require('cors');
const board = require('./routes/board');

const port = 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes

app.use('/', board);
const start = async () => {
  try {
    await connectDB(process.env.URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
