const os = require('os');
console.log('OS Platform:', os.platform());
console.log('CPU Architecture:', os.arch());
console.log('Total Memory:', os.totalmem());
console.log('Free Memory:', os.freemem());
console.log('number of CPUs using:', os.cpus());
console.log('home directory using:', os.homedir());