import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupDatabase, testConnection } from './src/models/setup.js';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import flash from './src/middleware/flash.js';

// Import MVC components
import routes from './src/controllers/routes.js';
import globalMiddleware from './src/middleware/global.js';
/**
 * Server configuration
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';
const PORT = process.env.PORT || 3000;

/**
 * Setup Express Server
 */
const app = express();

/**
 * Configure Express
 */
// Initialize PostgreSQL session store
    const pgSession = connectPgSimple(session);

    // Configure session middleware
    app.use(session({
    store: new pgSession({
        conString: process.env.DB_URL,
        tableName: 'session', // The name for our "sessions" table in the db
        createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: NODE_ENV.includes('dev') !== true,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Allow Express to receive and process common POST data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use((req, res, next) => {
  // Initialize messages for EJS
  res.locals.messages = {
    success: [],
    error: [],
    warning: [],
    info: []
  };

  if (req.session.flash) {
    for (const type in req.session.flash) {
      if (Array.isArray(req.session.flash[type])) {
        res.locals.messages[type].push(...req.session.flash[type]);
      }
    }
    // Clear flash after reading
    req.session.flash = {
      success: [],
      error: [],
      warning: [],
      info: []
    };
  }

  // Pass session to templates
  res.locals.session = req.session;

  next();
});

/**
 * Global Middleware
 */

app.use(flash); // Add this line BEFORE globalMiddleware

app.use(globalMiddleware);

/**
 * Routes
 */
app.use('/', routes);

/**
 * Error Handling
 */

// 404 handler
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
});

// Global error handler
app.use((err, req, res, next) => {
    // Determine status and template
    const status = err.status || 500;
    const template = status === 404 ? '404' : '500';

    // Only log non-404 errors for debugging purposes
    if (status !== 404) {
        // Log error details for debugging
        console.error('Error occurred:', err.message);
        console.error('Stack trace:', err.stack);
    }

    // Prepare data for the template
    const context = {
        title: status === 404 ? 'Page Not Found' : 'Server Error',
        error: err.message,
        stack: err.stack
    };

    // Render the appropriate error template
    res.status(status).render(`errors/${template}`, context);
});

/**
 * Start WebSocket Server in Development Mode; used for live reloading
 */
if (NODE_ENV.includes('dev')) {
    const ws = await import('ws');

    try {
        const wsPort = parseInt(PORT) + 1;
        const wsServer = new ws.WebSocketServer({ port: wsPort });

        wsServer.on('listening', () => {
            console.log(`WebSocket server is running on port ${wsPort}`);
        });

        wsServer.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
    } catch (error) {
        console.error('Failed to start WebSocket server:', error);
    }
}

/**
 * Start Server
 */
app.listen(PORT, async () => {
    try {
        await testConnection();
        await setupDatabase();
        console.log(`Server is running on http://127.0.0.1:${PORT}`);
    } catch (error) {
        console.error('Database setup failed:', error.message);
        process.exit(1);
    }
});