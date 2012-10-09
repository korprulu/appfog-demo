var express = require('express')
    app = express(),
    mongo = require('mongodb'),
    db_env = process.env.VCAP_SERVICES ?
        JSON.parse(process.env.VCAP_SERVICES)['mongodb-1.8'][0]['credentials'] : 
            {host: 'localhost', port: mongo.Connection.DEFAULT_PORT},
    db = new mongo.Db('appfog_demo', new mongo.Server(db_env.host, db_env.port));

// setting the static file path
// app.use('/js', express.static('js'));
// app.use('/css', express.static('css'));
// app.use('/image', express.static('image'));
app.use(express.bodyParser());

db.open(function(err, db) {
    if(!err)
        app.listen(process.env.VCAP_APP_PORT || 8080);
});

app.get('/', function(req, resp){
    resp.sendfile('index.html');
});

app.get('/all', function(req, resp){
    db.collection('message_board', function(err, collection) {
        err ? resp.send(500) : collection.find({}).toArray(function(err, docs){
            err ? resp.send(500) : resp.json(docs);
        });
    });
});

app.post('/speak', function(req, resp) {

    db.collection('message_board', function(err, collection) {
        if (err)
            resp.send(500);
        else {
            var data = req.body;
            data.date = new Date;
            data.source_ip = req.ip;
            collection.insert(data, {safe: true}, function(err, doc) {
                if (err) {
                    console.log(err);
                    resp.send(500);
                }
                else {
                    resp.json(doc);
                }
            });
        }
    });
});

app.get('/clean', function(req, resp){
    db.collection('message_board', function(err, collection) {
        if (err)
            resp.send(500);
        else {
            collection.remove();
            resp.json(true);
        }
    });
});

console.log('Server running at http://127.0.0.1:8080/');
