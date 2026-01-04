const helmet = require('helmet');
const cors = require('cors');

const setupSecurity = (app) => {
  // Helmet helps secure Express apps by setting various HTTP headers
  app.use(helmet());

  // CORS configuration
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost',
    'https://budget.roger.works',
    'http://budget.roger.works'
  ];

  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.CORS_ORIGIN === '*') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
  app.use(cors(corsOptions));

  // Disable X-Powered-By header
  app.disable('x-powered-by');

  // Additional security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
};

module.exports = { setupSecurity };
