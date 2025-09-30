// Imports
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

// Variables
const app = express();
const name = process.env.NAME;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the port number the server will listen on
const NODE_ENV = process.env.NODE_ENV || 'production';
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Tell Express where to find your templates
app.set('views', path.join(__dirname, 'src/views'));

/**
 * Global template variables middleware
 * 
 * Makes common variables available to all EJS templates without having to pass
 * them individually from each route handler
 */
app.use((req, res, next) => {
    // Make NODE_ENV available to all templates
    res.locals.NODE_ENV = NODE_ENV.toLowerCase() || 'production';

    // Continue to the next middleware or route handler
    next();
});


//Routes
app.get('/', (req, res) => {
    const title = 'Welcome Home';
    res.render('home', { title });
});

app.get('/about', (req, res) => {
    const title = 'About Me';
    res.render('about', { title });
});

app.get('/products', (req, res) => {
    const title = 'Our Products';
    res.render('products', { title });
});

app.get('/demo/:color/:size', (req, res) => {
    const title = 'Params Demo';
    const { color, food } = req.params;  //destructure the parameters from the URL
    res.render('demo', { title, color, food });
});

// Test route for 500 errors
app.get('/test-error', (req, res, next) => {
    const err = new Error('This is a test error');
    err.status = 500;
    next(err);
});

// 404 catch-all page
app.use((req, res, next) => {
    const err = new Error('Page not found!');
    err.status = 404;
    // res.status(404).render('404', { title: 'Not Found' });
    next(err);
}); 

// Global error handler
app.use((err, req, res, next) => {
    // Log error details for debugging
    console.error('Error occurred:', err.message);
    console.error('Stack trace:', err.stack);

    // Determine status and template
    const status = err.status || 500;
    const template = status === 404 ? '404' : '500';

    // Prepare data for the template
    const context = {
        title: status === 404 ? 'Page Not Found' : 'Server Error',
        error: err.message,
        stack: err.stack
    };

    // Render the appropriate error template
    res.status(status).render(`errors/${template}`, context);
});


// global error handler- in class
// app.use((err, req, res, next) => {
//     err.statuts = err.status || 500;

//     if (err.status === 404) {
//     res.status(404).render('404', { title: 'Not Found' });
//     return;
//     }

//     res.status(500).render('500', { title: 'Server Error' });
// });

// When in development mode, start a WebSocket server for live reloading
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

// Start the server and listen on the specified port
app.listen(PORT, () => {
    console.log(`Server is running on http://127.0.0.1:${PORT}`);
});