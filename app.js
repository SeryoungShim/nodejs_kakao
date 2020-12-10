const express = require("express");
const app = express();
var https = require('https');
var request = require('request');

app.use(express.static('public'));
app.use(express.static('templates'));
app.use(express.static('views'));
app.set('view engine','ejs');

// MongoDB
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://admin:booogle@nextfit.vdgrr.mongodb.net/Training?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
var collection, trainDB;
client.connect(err => {
    // collection = client.db("Training").collection("userInfo");
    // collection = client.db("Training").collection("contents");
    // collection.find().forEach(function(doc){
    //     console.log(doc);
    // })
    if(err)
        console.log("error");
    else{
        trainDB = client.db("Training");
    }
});


var REST_API_KEY = "f0d91450e5908256bd3d810dbc00040c"
var headers = {
    'Content-type': 'application/x-www-form-urlencoded;application/json;charset=utf-8',
    'Cache-Control': "no-cache",
};
var access_token, user;

app.get('/', (req, res) => {
    res.render('index');
})
app.get('/about', (req, res) => {
    res.render('hello', {name:req.query.name});
})
app.get('/oauth', (req, res) => {
    var REDIRECT_URI = "http://localhost:3000/oauth";
    // get TOKEN
    var params = {
        "grant_type": "authorization_code",
        "client_id": REST_API_KEY,
        "redirect_uri": REDIRECT_URI,
        "code": req.query.code
    };
    function getUserInfo(accessToken){
        function saveInfo(data){
            if("profile_image_url" in data["kakao_account"]["profile"]){
                return {
                    _id: data['id'],
                    image: data["kakao_account"]["profile"]["profile_image_url"],
                    nickname: data["kakao_account"]["profile"]["nickname"], 
                    gender: data["kakao_account"]["gender"], 
                    age: data["kakao_account"]["age_range"]
                }
            }
            return {
                _id: data['id'],
                nickname: data["kakao_account"]["profile"]["nickname"], 
                gender: data["kakao_account"]["gender"], 
                age: data["kakao_account"]["age_range"]
            }
        }
        var params = {
            "property_keys": ["kakao_account.profile","kakao_account.age_range","kakao_account.gender","kakao_account.email"]
        };
        headers["Authorization"] = `Bearer ${accessToken}`
        
        // db.people.update( { name: "Elly" }, { name: "Elly", age: 17 }, { upsert: true } )
        request.post("https://kapi.kakao.com/v2/user/me", {headers:headers, form:params}, async function(err, response, body){
            var data = JSON.parse(body);
            console.log("GET [user info]");
            var user_info = saveInfo(data);
            await res.render('logged', {user_info:user_info});
            await trainDB.collection("userInfo").updateOne({_id: data['id']}, {$set: user_info}, {upsert:true}, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
            });
        });
    }
    request.post("https://kauth.kakao.com/oauth/token", {form:params}, (err, response, body)=>{
        var data = JSON.parse(body);
        getUserInfo(data.access_token);
        console.log("GET [access token]");
    });
})

app.listen(3000, () => {
    console.log('server STARTED http://localhost:3000');
})