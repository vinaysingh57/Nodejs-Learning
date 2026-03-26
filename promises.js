
const fs = require('fs').promises;

async function readFiles() {
  console.log('Starting file reads...');

  try {
    // Start reading all files in parallel
    const [data1, data2, data3] = await Promise.all([
      fs.readFile('file1.txt', 'utf8'),
      fs.readFile('file2.txt', 'utf8'),
      fs.readFile('file3.txt', 'utf8')
    ]);

    // Print file1 and file3 first, then file2
    console.log('File 1:', data1);
    console.log('File 3:', data3);
    console.log('File 2:', data2);

    console.log('All files read successfully!');
  } catch (err) {
    console.error('Error reading files:', err);
  }
  console.log('Ending file reads...');
}

readFiles();

console.log('This is End of file reads...');
