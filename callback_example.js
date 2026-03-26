const fs = require('fs');

console.log('Starting file reads...');

fs.readFile('file1.txt','utf-8', (err,data)=> {
    console.log("Example of Call Back Function  in Node.js File 1");
});

fs.readFile('file2.txt','utf-8', (err,data)=> {
    console.log("Example of Call Back Function  in Node.js File 2");
});

console.log('This is End of file reads...');