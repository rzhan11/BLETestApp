#!/usr/bin/nodejs

const express = require('express')
const path = require("path");
const hbs = require("hbs");
const requirejs = require("requirejs");

var app = express();

app.set('port', process.env.PORT || 8080);

app.set('views', './client/views');
app.set('view engine', 'hbs');

app.use('/js', express.static(path.join(__dirname, 'client/js')));


app.get('/', function(req, res){
    console.log("home anon()");
    res.render("home", {
    });
});

var listener = app.listen(app.get('port'), function() {
  console.log('Express server started on port: ' + listener.address().port);
});
