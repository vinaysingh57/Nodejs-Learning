const fs =require('fs');

// read a fle
fs.readFile('file_read_example.txt', 'utf8',(err, data) => {
    if(err) {
        console.error('Error in reading File', err);
    }	
        console.log('File Content => ', data);
});

// read Synchronous
const data1 = fs.readFileSync('file_read_example.txt', 'utf8');
console.log('File Content2 => ', data1);



// write a file
fs.writeFileSync('file_read_example.txt', 'Testing purpose',(err)=>{
    if(err){
        console.error('Error in Writing File', err);
    }
        console.log('Write Successfully');
});


// Write Synchronous 
fs.writeFileSync('example.txt', 'Hello, Node.js!');


// append content
fs.appendFileSync('file_read_example.txt', 'Appended Content',(err)=>{
    if(err){
        console.error('Error in Writing File', err);
    }
        console.log('Content Appended Successfully');
});

// Append Synchronous 
fs.appendFileSync('example.txt', '\nThis is appended text.');


// delete file
fs.unlink('example.txt',(err) => {
    if(err){
        console.error('Error in deleting File', err);
    }
        console.log('File Deleted => ');
});
