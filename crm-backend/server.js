import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Load env vars
dotenv.config();

// Import database connection
import connectDB from './src/config/database.js';

// Import routes
import authRoutes from './src/routes/authRoutes.js';
import clientRoutes from './src/routes/clientRoutes.js';
import leadRoutes from './src/routes/leadRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import settingsRoutes from './src/routes/settingsRoutes.js';
import quotationRoutes from './src/routes/quotationRoutes.js';
import invoiceRoutes from './src/routes/invoiceRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import amcRoutes from './src/routes/amcRoutes.js';
import callLogRoutes from './src/routes/callLogRoutes.js';
import aiRoutes from './src/routes/aiRoutes.js';
import documentRoutes from './src/routes/documentRoutes.js';
import portalAuthRoutes from './src/routes/portalAuthRoutes.js';
import portalRoutes from './src/routes/portalRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import { ensureSuperAdmin } from './src/utils/bootstrap.js';
import integrationRoutes from './src/routes/integrationRoutes.js';

// Import middleware
import { errorHandler, notFound } from './src/middleware/error.js';

// Import cron jobs
import { startCronJobs } from './src/cron/scheduler.js';

// Connect to database
connectDB().then(() => {
  // Ensure Super Admin exists once DB is connected
  ensureSuperAdmin();
}).catch(() => {});

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ATPL-CRM API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/amcs', amcRoutes);
app.use('/api/calls', callLogRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/portal/auth', portalAuthRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/integrations', integrationRoutes);
// app.use('/api/expenses', expenseRoutes);
// app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        ✨ ATPL-CRM Backend Server Started ✨             ║
║                                                           ║
║  🚀 Server running on port: ${PORT}                       ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}                            ║
║  📊 API Base URL: http://localhost:${PORT}/api            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Start cron jobs in production
  if (process.env.NODE_ENV === 'production') {
    startCronJobs();
  } else {
    console.log('ℹ️  Cron jobs disabled in development mode');
    console.log('💡 Set NODE_ENV=production to enable automation');
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💤 Process terminated');
  });
});

export default app;
