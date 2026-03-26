const fs = require('fs');
const { exit } = require('process');
/*
const book = {
    title : "Ego is the Enemy",
    author : "Ryan Holiday"
}

// print the object as a string
console.log(book)
console.log(book.author)

// convert object to JSON string
const bookJSON = JSON.stringify(book);
console.log(bookJSON)

// convert JSON string back to object
const bookObject = JSON.parse(bookJSON);
console.log(bookObject)
console.log(bookObject.author)

// write JSON string to a file
fs.writeFileSync('1-json.json', bookJSON);

// read JSON string from a file and convert it back to an object
const dataBuffer = fs.readFileSync('1-json.json');
//console.log(dataBuffer) // this will print the buffer data, not the string
console.log(dataBuffer);
// convert buffer data to string
const dataJSON = dataBuffer.toString();
//console.log(dataJSON) // this will print the JSON string
console.log(dataJSON);
// convert JSON string back to object
const data = JSON.parse(dataJSON);
console.log(data.title);
*/
const info = {
    name: 'Addrew Singh',
    age: 21
}

console.log(info.name);

const infoJSON=JSON.stringify(info);
fs.writeFileSync('2-json.json', infoJSON);

const dataBuffer = fs.readFileSync('2-json.json');
const dataJSON = dataBuffer.toString();
const data = JSON.parse(dataJSON);
console.log(data.name);
data.name="vinay singh"
data.age=34
const newDataJSON = JSON.stringify(data);
fs.writeFileSync('2-json.json', newDataJSON);
console.log(data.name);



