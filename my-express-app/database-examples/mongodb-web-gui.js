// MongoDB Web GUI - Simple Express App for Database Visualization
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3003;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/node-learning');

app.use(express.json());
app.use(express.static('public'));

// Serve HTML page
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MongoDB Web GUI</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #13aa52; text-align: center; margin-bottom: 30px; }
            .db-info { background: #e8f5e8; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .collections { display: grid; gap: 20px; }
            .collection { background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #13aa52; }
            .collection h3 { margin-top: 0; color: #2c5530; }
            .documents { margin-top: 10px; }
            .document { background: white; padding: 10px; margin: 5px 0; border-radius: 3px; border: 1px solid #ddd; font-family: monospace; font-size: 12px; }
            .count { color: #666; font-size: 14px; }
            button { background: #13aa52; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 5px; }
            button:hover { background: #0f8b42; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🍃 MongoDB Web GUI</h1>
            <div class="db-info">
                <h2>Database: node-learning</h2>
                <button onclick="refreshData()">🔄 Refresh Data</button>
                <button onclick="showDatabases()">📊 Show All Databases</button>
            </div>
            
            <div id="content">
                <div class="collections" id="collections">
                    Loading collections...
                </div>
            </div>
        </div>

        <script>
            async function refreshData() {
                try {
                    document.getElementById('collections').innerHTML = 'Loading collections...';
                    const response = await fetch('/api/collections');
                    const collections = await response.json();
                    displayCollections(collections);
                } catch (error) {
                    console.error('Error:', error);
                    document.getElementById('collections').innerHTML = 'Error loading collections: ' + error.message;
                }
            }

            async function showDatabases() {
                try {
                    const response = await fetch('/api/databases');
                    const databases = await response.json();
                    alert('Available Databases: ' + databases.map(db => db.name).join(', '));
                } catch (error) {
                    alert('Error loading databases: ' + error.message);
                }
            }

            function displayCollections(collections) {
                const container = document.getElementById('collections');
                if (collections.length === 0) {
                    container.innerHTML = '<p>No collections found in the database.</p>';
                    return;
                }

                container.innerHTML = collections.map(collection => {
                    const documentsHtml = collection.documents.map(doc => 
                        '<div class="document">' + JSON.stringify(doc, null, 2) + '</div>'
                    ).join('');

                    return `
                        <div class="collection">
                            <h3>📁 ${collection.name}</h3>
                            <p class="count">Documents: ${collection.count}</p>
                            <div class="documents">
                                ${documentsHtml || '<p>No documents found.</p>'}
                            </div>
                        </div>
                    `;
                }).join('');
            }

            // Load data on page load
            refreshData();
            
            // Auto-refresh every 30 seconds
            setInterval(refreshData, 30000);
        </script>
    </body>
    </html>
    `);
});

// API to get all collections and their documents
app.get('/api/collections', async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        const result = await Promise.all(collections.map(async (col) => {
            const collection = db.collection(col.name);
            const count = await collection.countDocuments();
            const documents = await collection.find({}).limit(10).toArray(); // Limit to 10 for display
            
            return {
                name: col.name,
                count: count,
                documents: documents
            };
        }));
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to get all databases
app.get('/api/databases', async (req, res) => {
    try {
        const admin = mongoose.connection.db.admin();
        const databases = await admin.listDatabases();
        res.json(databases.databases);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to get specific collection data
app.get('/api/collection/:name', async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const collection = db.collection(req.params.name);
        const documents = await collection.find({}).toArray();
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`🌐 MongoDB Web GUI running at http://localhost:${port}`);
    console.log(`📊 View your MongoDB data in your browser!`);
    console.log(`🔗 Connected to MongoDB: node-learning database`);
});

module.exports = app;