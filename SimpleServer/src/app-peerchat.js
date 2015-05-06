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
    style: fs.readFileSync('style.css'),
    uikitjs: fs.readFileSync('../../common/lib/uikit/js/uikit.js'),
    uikitcss: fs.readFileSync('../../common/lib/uikit/css/uikit.almost-flat.css'),
    assets: {
        twa: fs.readFileSync('../../common/assets/icons/two-way-arrows.png'),
        x: fs.readFileSync('../../common/assets/icons/x.png'),
        minus: fs.readFileSync('../../common/assets/icons/minus.png'),
        twa_blue: fs.readFileSync('../../common/assets/icons/two-way-arrows-blue.png'),
        x_blue: fs.readFileSync('../../common/assets/icons/x-blue.png'),
        minus_blue: fs.readFileSync('../../common/assets/icons/minus-blue.png')

    }
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

app.use('/uikit.js', function(req, res){
    res.setHeader("Content-Type", "application/javascript");
    res.end(files.uikitjs);
});

app.use('/uikit.css', function(req, res){
    res.setHeader("Content-Type", "text/css");
    res.end(files.uikitcss);
});

app.use('/x.png', function(req, res){
    res.setHeader("Content-Type", "image/png");
    res.end(files.assets.x);
});

app.use('/twa.png', function(req, res){
    res.setHeader("Content-Type", "image/png");
    res.end(files.assets.twa);
});

app.use('/minus.png', function(req, res){
    res.setHeader("Content-Type", "image/png");
    res.end(files.assets.minus);
});

app.use('/x-blue.png', function(req, res){
    res.setHeader("Content-Type", "image/png");
    res.end(files.assets.x_blue);
});

app.use('/twa-blue.png', function(req, res){
    res.setHeader("Content-Type", "image/png");
    res.end(files.assets.twa_blue);
});

app.use('/minus-blue.png', function(req, res){
    res.setHeader("Content-Type", "image/png");
    res.end(files.assets.minus_blue);
});


app.use('/', function(req, res){
    res.setHeader("Content-Type", "text/html");
    res.end(files.index);
});



http.createServer(app).listen(4345);