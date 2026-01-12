const EventEmitter = require('events');
const eventEmitter = new EventEmitter();
//console.log(eventEmitter);
// register an event 
eventEmitter.on('greet', (name) => {
	
    console.log(`Hello, ${name}!`);
	console.log('Hello ', name);
});

// register an event 
eventEmitter.on('greet', (name) => {
	
    console.log(`user Logged, ${name}!`);
});
// trigger an event
eventEmitter.emit('greet','Vinay');

// trigger an event
eventEmitter.emit('greet','Sumit');



// Once and on difference Start

	const emitter = new EventEmitter();

	// Using .on()
	emitter.on('ping', () => {
		console.log('Ping received (on)');
	});

	// Using .once()
	emitter.once('ping', () => {
		console.log('Ping received (once)');
	});

	// Emit event multiple times
	emitter.emit('ping');
	emitter.emit('ping');
// Once and on difference Start

// remove listner
	const emirmv = new EventEmitter();

	function greet(name) {
		console.log(`Hello, ${name}!`);
	}

	// Add listener
	emirmv.on('greetrm', greet);

	// Emit event
	emirmv.emit('greetrm', 'Vinay');

	// Remove listener
	emirmv.removeListener('greetrm', greet);

	// Emit again (listener removed)
	emirmv.emit('greetrm', 'Vinay');






