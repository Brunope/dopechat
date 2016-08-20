var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');

var urlencodedParser = bodyParser.urlencoded({extended: false});

var app = express();

app.use(express.static('./'));
app.use(bodyParser.json());

app.get('/', function(req, res) {
    res.sendFile('index.html');
});

var clients = {};
var clientId = 0;
//var clients = {};  // <- Keep a map of attached clients

// Called once for each new client. Note, this response is left open!
app.get('/events/', function(req, res) {
    req.socket.setTimeout(Number.MAX_SAFE_INTEGER);
    res.writeHead(200, {
    	'Content-Type': 'text/event-stream',  // <- Important headers
    	'Cache-Control': 'no-cache',
    	'Connection': 'keep-alive'
    });
    res.write('\n');
    (function(clientId) {
        console.log('adding client ' + clientId);
        clients[clientId] = res;
        //clients[clientId] = res;  // <- Add this client to those we consider "attached"

        req.on("close", function() {
            console.log('removing client ' + clientId);
            delete clients[clientId]});  // <- Remove this client when he disconnects
    })(clientId++)
});

app.post('/', function (req, res) {
    console.log(req.body);
    console.log('should be... ' + req.body.message);
    res.end();
    push_to_clients(req.body.message);
});

app.post('/process_post', urlencodedParser, function(req, res) {
    console.log(req.body);
    //res.end(JSON.stringify(response));
    //res.end();
    res.end('ok');
    push_to_clients(req.body.message);
});
var push_to_clients = function(message) {
    var date = new Date();
    var dateString = date.toString().split(' ')[4];
    for (key in clients) {
        var data = 'data: { "message": "' + message +
            '", "time": "' + dateString + '" }\n\n';
        console.log('writing to client ' + data);
        clients[key].write(data);
    };
}

var server = app.listen(54321, function(err) {
    var host = server.address().address;
    var port = server.address().port;
    console.log('running on http://%s:%s', host, port);
});
