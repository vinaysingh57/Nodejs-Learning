const express = require('express');
const app = express();
const port = 3000;

// Define a route
app.get('/',(req, res)=> {
	res.send('Hello Express!');
});

// Start Server

app.listen(port, () => {
	console.log(`Server is runnig on http://localhost:${port}`);
});
