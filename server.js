var connect = require('connect');

connect(
    connect['static'](__dirname+'/', { maxAge: 0 })
).listen(8080);

console.log('Server running...');