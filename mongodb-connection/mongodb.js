
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/mydb')
  .then(() => console.log("Connected"))
  .catch(err => console.log(err));
