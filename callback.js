
/*
const fs = require('fs');
fs.readFile('callback.txt', 'utf8', (err, data) => {
	if(err) {
	     console.log('Error: ', err);
             return;
	}
	console.log('File Content: ', data);
});
*/

/*

function greet(name, callback) {
  console.log('Hello ' + name);
  callback(); // calling back the function passed
}

greet('Vinay', sayGoodbye);

function print() {
	console.log('Have a great day!');
}

greet('Vinay', print);

function sayGoodbye() {
  console.log('Goodbye!');
}
*/

function addTwonumbers(name, testing) {
  console.log('Username: ' + name);
  testing();
}


function print() {
  console.log('This is a callback function after Sumit Name.');
}

addTwonumbers('Sumit', print);





