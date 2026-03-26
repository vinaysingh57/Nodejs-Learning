
const fs = require('fs');

console.log('Start');

// Callback-based async I/O
fs.readFile('file1.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log('Callback: File read complete');
});

// Promise-based async
Promise.resolve().then(() => {
  console.log('Promise: Microtask executed');
});

console.log('End');