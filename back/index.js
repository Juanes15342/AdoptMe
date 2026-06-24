const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Import Routes
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const mascotasRouter = require('./routes/mascotas');
const adopcionesRouter = require('./routes/adopciones');
const testRouter = require('./routes/test');

// Mount routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/mascotas', mascotasRouter);
app.use('/api/adopciones', adopcionesRouter);
app.use('/api/crud-test', testRouter);

app.listen(PORT, () => {
  console.log(`AdoptMe Backend listening on port ${PORT}`);
});
