const fs = require('fs').promises;
fs.readFile('example.txt','utf8')
.then(data => 
    console.log('File Content : ', data),
    console.log('Hello : ')
)
.catch(err => console.log('Error : ', err));
console.log('Last : ');
