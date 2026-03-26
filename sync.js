
const fs = require('fs');

console.log('Starting file reads...');

fs.readFile('file1.txt', 'utf8', (err, data1) => {
  if (err) throw err;
  console.log('File 1:', data1);

  fs.readFile('file2.txt', 'utf8', (err, data2) => {
    if (err) throw err;
    console.log('File 2:', data2);

    fs.readFile('file3.txt', 'utf8', (err, data3) => {
      if (err) throw err;
      console.log('File 3:', data3);
    });
  });
});

console.log('Reading files asynchronously...');