/**
 * Created by laice on 5/4/15.
 */
var http = require('http'),
    fs = require('fs'),
    connect = require('connect');

var app = connect();

var files = {
    index: fs.readFileSync('index.html'),
    app: fs.readFileSync('app.js'),
    utils: fs.readFileSync('../../common/src/ifp-utils/utils.js'),
    style: fs.readFileSync('style.css')
};

app.use('/app.js', function(req, res){
    res.setHeader("Content-Type", "application/javascript");
    res.end(files.app);
});

app.use('/utils.js', function(req, res){
    res.setHeader("Content-Type", "application/javascript");
    res.end(files.utils);
});

app.use('/style.css', function(req, res){
    res.setHeader("Content-Type", "text/css");
    res.end(files.style);
});

app.use('/', function(req, res){
    res.setHeader("Content-Type", "text/html");
    res.end(files.index);
});



http.createServer(app).listen(4345);