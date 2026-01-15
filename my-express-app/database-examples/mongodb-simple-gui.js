const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3003;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/node-learning');

app.use(express.json());

// Serve HTML page with MongoDB GUI
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MongoDB Web GUI</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                background: #f5f5f5; 
            }
            .container { 
                max-width: 1200px; 
                margin: 0 auto; 
                background: white; 
                padding: 20px; 
                border-radius: 8px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            }
            h1 { 
                color: #13aa52; 
                text-align: center; 
                margin-bottom: 30px; 
            }
            .db-info { 
                background: #e8f5e8; 
                padding: 15px; 
                border-radius: 5px; 
                margin-bottom: 20px; 
            }
            .collection { 
                background: #f9f9f9; 
                padding: 15px; 
                margin-bottom: 20px;
                border-radius: 5px; 
                border-left: 4px solid #13aa52; 
            }
            .collection h3 { 
                margin-top: 0; 
                color: #2c5530; 
            }
            .document { 
                background: white; 
                padding: 10px; 
                margin: 5px 0; 
                border-radius: 3px; 
                border: 1px solid #ddd; 
                font-family: monospace; 
                font-size: 12px; 
                white-space: pre-wrap;
            }
            .count { 
                color: #666; 
                font-size: 14px; 
            }
            button { 
                background: #13aa52; 
                color: white; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 4px; 
                cursor: pointer; 
                margin: 5px; 
            }
            button:hover { 
                background: #0f8b42; 
            }
            .loading { 
                text-align: center; 
                color: #666; 
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🍃 MongoDB Web GUI</h1>
            <div class="db-info">
                <h2>Database: node-learning</h2>
                <button onclick="loadData()">🔄 Refresh Data</button>
                <button onclick="showStats()">📊 Show Stats</button>
            </div>
            
            <div id="content" class="loading">
                Loading MongoDB data...
            </div>
        </div>

        <script>
            async function loadData() {
                try {
                    document.getElementById('content').innerHTML = '<div class="loading">Loading...</div>';
                    
                    const response = await fetch('/api/collections');
                    const data = await response.json();
                    
                    if (data.error) {
                        document.getElementById('content').innerHTML = 
                            '<div class="collection"><h3>Error:</h3><p>' + data.error + '</p></div>';
                        return;
                    }
                    
                    if (data.collections.length === 0) {
                        document.getElementById('content').innerHTML = 
                            '<div class="collection"><h3>No Collections Found</h3><p>Your database is empty. Create some data using your API first!</p></div>';
                        return;
                    }
                    
                    let html = '';
                    data.collections.forEach(collection => {
                        html += '<div class="collection">';
                        html += '<h3>📁 ' + collection.name + '</h3>';
                        html += '<p class="count">Documents: ' + collection.count + '</p>';
                        
                        if (collection.documents.length > 0) {
                            collection.documents.forEach(doc => {
                                html += '<div class="document">' + JSON.stringify(doc, null, 2) + '</div>';
                            });
                        } else {
                            html += '<p>No documents found.</p>';
                        }
                        
                        html += '</div>';
                    });
                    
                    document.getElementById('content').innerHTML = html;
                    
                } catch (error) {
                    document.getElementById('content').innerHTML = 
                        '<div class="collection"><h3>Connection Error:</h3><p>Could not connect to MongoDB: ' + error.message + '</p></div>';
                }
            }
            
            async function showStats() {
                try {
                    const response = await fetch('/api/stats');
                    const stats = await response.json();
                    alert('Database Stats: ' + JSON.stringify(stats, null, 2));
                } catch (error) {
                    alert('Error loading stats: ' + error.message);
                }
            }
            
            // Load data when page loads
            loadData();
            
            // Auto-refresh every 30 seconds
            setInterval(loadData, 30000);
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
            try {
                const collection = db.collection(col.name);
                const count = await collection.countDocuments();
                const documents = await collection.find({}).limit(5).toArray(); // Limit to 5 for display
                
                return {
                    name: col.name,
                    count: count,
                    documents: documents
                };
            } catch (err) {
                return {
                    name: col.name,
                    count: 0,
                    documents: [],
                    error: err.message
                };
            }
        }));
        
        res.json({ collections: result });
    } catch (error) {
        res.json({ error: error.message, collections: [] });
    }
});

// API to get database stats
app.get('/api/stats', async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const stats = await db.stats();
        res.json({
            database: stats.db,
            collections: stats.collections,
            documents: stats.objects,
            dataSize: Math.round(stats.dataSize / 1024) + ' KB',
            storageSize: Math.round(stats.storageSize / 1024) + ' KB'
        });
    } catch (error) {
        res.json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`🌐 MongoDB Web GUI running at http://localhost:${port}`);
    console.log(`📊 View your MongoDB data in your browser!`);
    console.log(`🔗 Connected to MongoDB: node-learning database`);
});

module.exports = app;