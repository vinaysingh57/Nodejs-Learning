const fs = require('fs').promises;

async function readFile() {
    try {
    const data = await fs.readFile('example.txt', 'utf8');
    console.log('Content : ', data);
    console.log('After data read');
    }
    catch(err) {
        console.log('Error : ', err);
    }
}
console.log('Before data read');
readFile();
console.log('End of Script');
