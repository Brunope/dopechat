/* TODOS
 * better system event communication separation from messages
 * handle same user across multiple instances
 */
var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var session = require('client-sessions');

var urlencodedParser = bodyParser.urlencoded({extended: false});

var app = express();

app.use(bodyParser.json());
app.use(session({
    cookieName: 'session',
    secret: '98j93hUtur5h5ehwTnt94tb4t3t3nf6SLSSS5',  // randy
    duration: 60 * 60 * 1000,
    activeDuration: 30 * 60 * 1000,
}));

app.get('/', function(req, res) {
    console.log('get index from ' + req.session.user);
    if (!req.session.user) {
        res.redirect('/login');
        return true;
    }
    res.sendFile(__dirname + '/public/work.html');
});

var clients = {};
var clientId = 0;

// reserved username for event messages (ie join, dc).
// clients interpret messages from this user differently.
SYSTEM_USER = '';

app.get('/login', function(req, res) {
    console.log('get login');
    res.sendFile(__dirname + '/public/login.html');
});

app.post('/login', urlencodedParser, function(req, res) {
    user = req.body.name;
    console.log('post login ' + user);
    if (user !== '' && !userTaken(user, clients)) {
        req.session.user = user;
        res.redirect('/');
        return true;
    } else {
        res.end('username taken');
    };
});

app.get('/logout', function(req, res) {
    console.log('get logout');
    delete req.session.user;
    res.redirect('/login');
    return true;
});

// Called once for each new client. Note, this response is left open!
app.get('/events/', function(req, res) {
    req.socket.setTimeout(Number.MAX_SAFE_INTEGER);
    res.writeHead(200, {
    	'Content-Type': 'text/event-stream',  // <- Important headers
    	'Cache-Control': 'no-cache',
    	'Connection': 'keep-alive'
    });
    res.connection.setTimeout(0);  // no timeout
    res.write('\n');
    (function(clientId) {
        console.log('adding client ' + clientId);
        if (!userTaken(req.session.user, clients)) {
            var weirdUserShenanigans = false;
        } else {
            var weirdUserShenanigans = true;
        }
        clients[clientId] = { conn: res, user: req.session.user };
        if (!weirdUserShenanigans) {
            push_to_clients(clients[clientId].user + ' joined', SYSTEM_USER);
        }
        req.on("close", function() {
            console.log('removing client ' + clientId);
            push_to_clients(clients[clientId].user + ' left', SYSTEM_USER);
            delete clients[clientId]});
    })(clientId++)
});

app.get('/users', function(req, res) {
    console.log('get users');
    var users = [];
    for (key in clients) {
        users.push(clients[key].user);
    }
    res.json(users);
});

app.post('/', urlencodedParser, function(req, res) {
    console.log(req.body);
    res.end('ok');
    if (!req.session) {
        res.redirect('/login');
        return true;
    }
    if (req.body.message.length) {
        push_to_clients(req.body.message, req.session.user);
    }
});

app.use(express.static('./public'));  // serve static files AFTER routing

var server = app.listen(54321, function(err) {
    var host = server.address().address;
    var port = server.address().port;
    console.log('running on http://%s:%s', host, port);
});

var push_to_clients = function(message, user) {
    var date = new Date();
    var dateString = date.toString().split(' ')[4];
    for (key in clients) {
        var data = 'data: { "message": "' + message +
            '", "time": "' + dateString +
            '", "name": "' + user + '" }\n\n';
        clients[key].conn.write(data);
    };
}

function userTaken(user, clients) {
    for (key in clients) {
        if (clients[key].user === user) {
            return true;
        }
    }
    return false;
};
