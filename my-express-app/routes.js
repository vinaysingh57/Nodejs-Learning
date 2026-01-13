const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware to allow browser requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
// GET route - retrieve data
app.get('/users', (req, res) => {
    res.json({ message: 'Get all users' });
});

// POST route - create new data
app.post('/users', (req, res) => {
    const { name, email } = req.body;
    console.log('Received POST data:', { name, email });
    res.json({ 
        message: 'Create new user',
        data: { name, email },
        timestamp: new Date().toISOString()
    });
});

// PUT route - update data
app.put('/users/:id', (req, res) => {
    const userId = req.params.id;
    res.json({ message: `Update user ${userId}` });
});

// DELETE route - delete data
app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    res.json({ message: `Delete user ${userId}` });
});

// Start Server
app.listen(port, () => {
    console.log(`Server is runnig on http://localhost:${port}`);
});