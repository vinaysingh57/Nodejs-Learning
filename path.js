const path =require('path');

const filePath = path.join(__dirname, 'folder', 'file.txt');
console.log('Joined Path:', filePath);

// Get file extension
console.log('Extension:', path.extname(filePath));



//console.log(path);
console.log(path.basename('test'));
console.log(path.resolve());

