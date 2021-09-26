if(process.env.NODE_ENV == "production"){
    module.exports = require('./build/try3d.min.js');
}
else{
    module.exports = require('./build/try3d.js');
}
