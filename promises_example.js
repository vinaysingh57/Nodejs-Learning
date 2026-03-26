
const fs = require('fs').promises;

function readFileContent() {
    
    Promise.fs.readFile('example.txt', 'utf-8')
    .then(console.log("File content:", data))
    .catch((error) => {
      console.error("Error reading file:", error);
    });
}

readFileContent();
