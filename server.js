const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');


dotenv.config();


const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');


const app = express();
app.use(cors());
app.use(express.json());


// simple health check
app.get('/', (req, res) => res.json({ ok: true }));


app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);


const PORT = process.env.PORT || 5000;


mongoose.connect(process.env.MONGO_URI, {
useNewUrlParser: true,
useUnifiedTopology: true,
})
.then(() => {
console.log('Connected to MongoDB');
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch((err) => {
console.error('MongoDB connection error:', err);
});