const express = require('express');
const session = require('express-session');
const routes = require('./routes/router');
const cors = require('cors');
const db = require('./config/db'); 
const port = 3000;
const app = express();
const paypalRoutes = require('./routes/paypalRoutes');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Add support for JSON requests

app.use(session({
    secret: 'hello_world_my_secret_key',
    resave: false,
    saveUninitialized: true
}));
app.use((req, res, next) => {
    res.locals.session = req.session; // Make session available in EJS views
    next();
});

app.use(cors());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Homepage Route
app.get('/', (req, res) => {
    res.render('index', {currentPage: 'home'}); // Render the homepage view (home.ejs)
});

app.use('/', routes)
app.use('/api/paypal', paypalRoutes); // Prefix PayPal routes

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

db.init_db()
    .then(() => {
        app.listen(port, () => {
            console.log(`Connected: Running on http://localhost:${port}`);
        });
    })
    .catch((error) => {
        console.error('Database initialization failed', error);
    });
