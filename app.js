var express = require("express");
var mongoose = require("mongoose");
var path = require("path");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var flash = require("connect-flash");
var passport = require("passport");
var setUpPassport = require("./setuppassport");

var routes = require("./routes/routes"); //direct file to routes dir

var app = express();
var url = process.env.MONGOLAB_URI;

//mongoose.connect("mongodb://localhost:27017/test"); //use the test db - when is test created??
mongoose.connect(url); //use the mLab free tier db
setUpPassport();

app.set("port", process.env.PORT || 3000); 
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//the following sets up to use four middlewares
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({
    secret: "thisissupposedtobeasecretkey-doesittakeanyinput??",
    resave: true,
    saveUninitialized: true
}));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.use(routes);

app.listen(app.get("port"), function() {
    console.log("Server started on port " + app.get("port"));
});


