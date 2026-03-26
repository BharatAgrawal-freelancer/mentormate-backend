const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

const menteeProfileRoutes = require("./routes/menteeProfileRoute");
const authRouter = require('./routes/authRoutes');
const mentorProfileRouter = require("./routes/mentorProfileRoutes");
const requestRoutes = require("./routes/requestRoutes");
const mentorRegisterRoutes = require("./routes/mentorRegisterRoutes");
const searchRoutes = require("./routes/searchRoutes");
const videoRoutes = require("./routes/agoraTokenRoute");
const scheduleAgoraTokenGeneration = require("./scheduler/tokenScheduler");

dotenv.config();
connectDB();

const app = express();

// CORS options
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://www.mentormate.dev'
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};
// Middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" })); 
app.use(express.urlencoded({ extended: true, limit: "50mb" })); 
app.use(cookieParser());

// Routes
app.use("/api/profile", menteeProfileRoutes);
app.use('/api/mentor', mentorProfileRouter);
app.use('/api/auth', authRouter);
app.use("/api", requestRoutes);
app.use("/api", mentorRegisterRoutes);
app.use("/api", searchRoutes);
app.use("/api/video", videoRoutes);

// Start scheduler
scheduleAgoraTokenGeneration();

app.get('/', (req, res) => {
  res.send('🏥 Server API is running...');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
