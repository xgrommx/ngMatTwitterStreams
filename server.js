var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(server);
var Twit = require('twit')
var searches = {};

var T = new Twit({
    consumer_key: '2uNSQqLbwDf1XIKAAiRaiv2zc',
    consumer_secret: 'qGRwz1XukYq7c7bZA3qw0ijERPA8s2BTjZNKTtQNIkN6tgH46I',
    access_token:'47378651-vVwzA5e3BzHODrZsQnE9jb5AYN7lih3AjJaNEyyT0',
    access_token_secret:'cyn8pLJ2MoQq3aRFknlJOKtQQ0YdvtKxEVkp1MBkXcjCw'
});

app.use(express.static(path.join(__dirname,'public')));

app.get('/', function(req,res){
    res.sendFile(__dirname + '/index.html');
});

//sockets
io.on('connection', function(socket){
    searches[socket.id] = {};
    socket.on('q', function(q){
        if(!searches[socket.id][q]){
            console.log('New Search >>', q);

            var stream = T.stream('statuses/filter', {
                track: q
            });

            stream.on('tweet', function(tweet){
                console.log(q, tweet.id);
                socket.emit('tweet_' + q, tweet);
            });

            stream.on('limit', function(limitMessage){
                console.log('Limit for user : ' + socket.id + ' on query ' + q + ' has reached!');
            });

            stream.on('warning', function(warning){
                console.log('warning', warning);
            });

            // https://dev.twitter.com/streaming/overview/connecting
            stream.on('reconnect', function(req,res,connectInterval){
                console.log('reconnect :: connectInterval', connectInterval);
            });

            stream.on('disconnect', function(disconnectMessage){
                console.log('disconnect', disconnectMessage);
            });

            searches[socket.id][q] = stream;

        }
    });

    socket.on('remove', function(q){
        searches[socket.id][q].stop();
        delete searches[socket.id][q];
        console.log('Removed Search >>', q);
    });

    socket.on('disconnect', function(){
        for (var k in searches[socket.id]){
            searches[socket.id][k].stop();
            delete searches[socket.id][k];
        }
        delete searches[socket.id];
        console.log('Removed all search from user >>' socket.id);
    });

});

server.listen(3000);
console.log('Server listening on port 3000');
