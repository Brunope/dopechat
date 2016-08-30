/* TODOS
 * XSS
 * better system event communication separation from messages
 * fix the undefined name timeout without login bug
 * buy a domain for trusted https
 */
var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var session = require('client-sessions');
var https = require('https');
var escape = require('escape-html');
var urlencodedParser = bodyParser.urlencoded({extended: false});

var privateKey = fs.readFileSync('ssl/chat.key', 'utf8');
var certificate = fs.readFileSync('ssl/chat.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};
var httpPort = 54321;
var httpsPort = 55555;

var userFile = 'users.txt';  // list of all user names ever used

var app = express();

app.use(bodyParser.json());
app.use(session({
    cookieName: 'session',
    secret: fs.readFileSync('secret.txt', 'utf8'),
    duration: 60 * 60 * 1000,
    activeDuration: 30 * 60 * 1000,
}));

var clients = {};
var clientId = 0;

// reserved username for event messages (ie join, dc).
// clients interpret messages from this user differently.
SYSTEM_USER = '';

app.get('/', function(req, res) {
    console.log('get index from ' + req.session.user);
    if (!req.session.user) {
        res.redirect('/login');
        return true;
    }
    
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/work', function(req, res) {
    if (!req.session.user) {
        req.session.room = 'work';
        res.redirect('/login');
        return true;
    }
    res.sendFile(__dirname + '/public/work.html');
});

app.get('/2pac', function(req, res) {
    if (!req.session.user) {
        req.session.room = 'work';
        res.redirect('/login');
        return true;
    }
    res.sendFile(__dirname + '/public/2pac.html');
});

app.get('/login', function(req, res) {
    console.log('get login');
    res.sendFile(__dirname + '/public/login.html');
});

app.post('/login', urlencodedParser, function(req, res) {
    user = req.body.name;
    console.log('post login ' + user);
    if (user !== '' && !userTaken(user, clients)) {
        req.session.user = user;
        // save user name
        fs.appendFile(userFile, user + '\n', function(err) {
            if (err) console.log(err);
        });
        if (req.session.room === 'work') {
            res.redirect('/work');
        } else {
            res.redirect('/');
        }
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

var httpsServer = https.createServer(credentials, app);
httpsServer.listen(httpsPort, function(err) {
    var host = httpsServer.address().address;
    var port = httpsServer.address().port;
    console.log('running https server on https://%s:%s', host, port);
});

var httpServer = app.listen(httpPort, function(err) {
    var host = httpServer.address().address;
    var port = httpServer.address().port;
    console.log('running http server on http://%s%s', host, port);
});



// helper functions

var push_to_clients = function(message, user) {
    var date = new Date();
    var dateString = date.toString().split(' ')[4];
    for (key in clients) {
        var data = 'data: { "message": "' + escape(message) +
            '", "time": "' + escape(dateString) +
            '", "name": "' + escape(user) + '" }\n\n';
        clients[key].conn.write(data);
    };
}

function userTaken(user, clients) {
    if (user === SYSTEM_USER) return true;
    for (key in clients) {
        if (clients[key].user === user) {
            return true;
        }
    }
    return false;
};
