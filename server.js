// load http module
const http = require('http');

// define the hostname and port
const hostname = '127.0.0.1';
const port = 3000;

// create a server
const server = http.createServer((req, res) => {

	// set the resposne hesder
	res.statusCode = 200;
	res.setHeader('Content-Type','text/plain');

	// send the resposne
	res.end('Hello, Node.js HTTP Server!');

} );

// Start the Server
server.listen(port, hostname, () => {
	console.log(`Server is running at http : ${hostname} : ${port}`);
});

