"use strict";
//require('dotenv').config();
const express = require("express");
var builder = require('botbuilder');
const ejs_1 = require("ejs");
const fetch = require("node-fetch");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/SpeechToText';


const app = express();
app.use(cookieParser());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const guid = () => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

app.post('/', (req, res) => {
    res.cookie('settings', req.body);
    res.redirect('/');
});

var connector = new builder.ChatConnector({
    appId: 'fc4dcc00-036d-44ff-b70f-b6fbe534cd33',
    appPassword: 'ygd3bjVzS2HQAL7GNrbP6bY'
});
var bot = new builder.UniversalBot(connector);

app.post('/api/messages', connector.listen());



bot.on('conversationUpdate', function (message) {
    console.log('inside conversationupdate')
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                bot.beginDialog(message.address, '/sayHi');
            }
        });
    }
});

const logUserConversation = (event) => {
    console.log(event.address.id)
    //console.log('message: ' + event.text + ', user: ' + event.address.user.name);
};


bot.use({
    receive: function (event, next) {
        logUserConversation(event);
        next();
    },
    send: function (event, next) {
        logUserConversation(event);
        next();
    }
});

var luisRecognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/0474cc3e-ab23-4ea7-9206-3d86c9a67842?subscription-key=e2e6e6cd7b93412682e9ccb596f9a00a&timezoneOffset=0&verbose=true&q=');
var intentDialog = new builder.IntentDialog({recognizers: [luisRecognizer]});
bot.dialog('/', intentDialog);

intentDialog.matches(/\b(hi|hello|hey|howdy)\b/i, '/sayHi') 
    .matches('GetNews', '/topNews') 
    .matches('AnalyseImage', '/analyseImage') 
    .onDefault(builder.DialogAction.send("Sorry, I didn't understand what you said.")); //Default message if all checks fail


bot.dialog('/sayHi', function(session) {
    session.send('Hi there!  Try saying things like "Get news in Toyko"');
    session.endDialog();
});

bot.dialog('/topNews', [
    function (session){
        builder.Prompts.choice(session, "Which category would you like?", "Technology|Science|Sports|Business|Entertainment|Politics|Health|World|(quit)");
    }, function (session, results){
        var userResponse = results.response.entity;
        session.endDialog("You selected: " + userResponse);
    }
]);


app.get('/', (req, res) => {
    const appSecret = (req.cookies.settings && req.cookies.settings.secret) || 'rXeqAxmmIBM.cwA.4z8.wELGgjHPl6Rja0NN4qALTkkhNDMzX3oUDIOOoE_gcsc';
    console.log(req.cookies.settings && req.cookies.settings.secret)
    const endpoint = 'https://directline.botframework.com/v3/directline/tokens/generate';
    const auth = 'Bearer';
    fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `${auth} ${appSecret}`, Accept: "application/json" }
    }).then(response => response.json()).then(result => {
        const token = result["token"];
        console.log("token", token, "retrieved at", new Date());
        ejs_1.renderFile("./index.ejs", {
            token,
            secret: req.cookies.settings && req.cookies.settings.secret
        }, (err, str) => {
            if (err)
                console.log("ejs error", err);
            else
                res.send(str);
        });
    });
});
app.listen(3978, () => {
    console.log('listening at 3978');
});
