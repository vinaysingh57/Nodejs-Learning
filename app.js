
/*const math =require('./math');

console.log(math.add(3,4));
console.log(math.substract(10,5));*/
/*
const chalk = require('chalk'); 
const validator = require('validator');

console.log(validator.isURL('https://www.google.com'));

console.log(chalk.red.inverse('Success!'));
*/
/*
console.log(process.argv)
console.log(process.argv[2])

const add = process.argv[2];
if(add === 'add'){
    console.log('Adding note!');
}

console.log(process.argv[3])
const remove = process.argv[3];
if(remove === 'remove'){
    console.log('Removing note!');
}
*/


//console.log(process.argv);


const yargs = require('yargs');


//console.log(yargs.argv['title']);

// create add command

yargs.version('1.1.0');

yargs.command({
    command: 'add',
    describe: 'Add a new note',
    builder: {
        title: {
            describe: 'Note title',
            demandOption: true,
            type: 'string'
        },
            body: {
                describe: 'Note body',
                demandOption: true,
                type: 'string'
            }
    },
    handler: function(argv){
        console.log('Adding a new note!' + argv.title);
        console.log('Note body: ' + argv.body);
    }
});

//remove command

yargs.command({
    command: 'remove',
    describe: 'Remove a note',
    handler: function(){
        console.log('Removing the note!');
    }
});

// read command
yargs.command({
    command: 'read',
    describe: 'Read a note',
    handler: function(){
        console.log('Reading the note!');
    }
});

// list command
yargs.command({
    command: 'list',
    describe: 'List your notes',
    handler: function(){
        console.log('Listing out all notes!');
    }
});

//console.log(yargs.argv);
yargs.parse();
