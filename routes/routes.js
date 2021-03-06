var express = require("express");
var User = require("../models/user");
var Poll = require("../models/poll");
var passport = require("passport");

var router = express.Router();

router.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.errors = req.flash("error");
    res.locals.infos = req.flash("info");
    next();
});

/* Old code
router.get("/", function(req, res, next){
    User.find()
    .sort({createdAt: "descending"})
    .exec(function(err, users) {
        if(err) {return next(err);}
        res.render("index", {users: users});
    });
});
*/

// display logged-in user's polls first, then other polls. If no one logged in yet, all the polls
router.get("/", function(req, res, next) { 
    var user = res.locals.currentUser;
    
    // find polls
    Poll.find()
    .sort({createdAt: "descending"})
    .exec(function(err, polls) {
        if(err) {return next(err);}
    
        // find polls with user as autor
        if (typeof req.user !== "undefined") { // make sure user is defined
            Poll.find({author: user._id})
            .sort({createdAt: "descending"})
            .exec(function(err, mypolls) {
                if(err) {return next(err);}
                res.render("index", {mypolls: mypolls, polls: polls});
                //console.log("User defined: mypolls=", user_polls, " polls: ", diff_polls);
                });
            }
    
        if (typeof req.user === "undefined") { // make sure user is defined {
            console.log("No user defined - entered");
            res.render("index", {mypolls: [], polls: polls} );
            }
    });
});


router.get("/users/:username", function(req, res, next){
    console.log("ZG: username is:", req.params.username);
    User.findOne({username: req.params.username}, function(err, user){
        if(err) {return next(err);}
        if(!user) {return next(404);}
        console.log("router.username: before render: username = ", user.username, " currentUser = ", res.locals.currentUser);
        res.render("profile", {user: user});
        console.log("router.username: after render: username = ", user.username, " currentUser = ", res.locals.currentUser);
    });
});

router.get("/users/polls/add", function(req, res){
    res.render("addpoll");
});

//handles adding a new poll
router.post("/users/polls/add", function(req, res){
    var tmp = 2;
    
    //console.log("Post user = ", req.user, " userID = ", req.user._id);

    let newPoll = new Poll({
        name: req.body.pollname,
        question: req.body.question,
        author: req.user._id
    });
    
    let option = "option1", n = 1;
    while(typeof req.body[option] !== "undefined") {
        newPoll.options.push({
            option: req.body[option],
            votes: 0
        });
        n++; option = "option"+n;
    }
    console.log("newPoll added", newPoll);
    newPoll.save();
    res.redirect("/");
})

//handles openning up a selected poll
router.get("/users/polls/:pollID", function(req, res, next){
    let pollid = req.params.pollID;
    Poll.findById(pollid, function(err, poll){
        if(err) return next(err);
        res.render("openpoll", {poll: poll});
    });
});

//get poll option selection which is radio 
router.post("/users/polls/vote", function(req, res, next){
    let pollid = req.body.pollID;
    let opt = req.body.option*1;
    Poll.findById(pollid, function(err, poll){
        if(err) return next(err);
        
        poll.options[opt].votes++;
        poll.votes++;
        poll.save();
        res.render("openpoll", {poll: poll});
    })
});


//delete poll 
router.post("/users/polls/delete/:pollID", function(req, res, next){
    let pollid = req.params.pollID;
    Poll.remove({_id: pollid}, function(err){
        if(err) return next(err);
        res.redirect("back");
    });
});

//share poll 
router.post("/users/polls/share/:pollID", function(req, res, next){
    let pollid = req.params.pollID;
    Poll.findById(pollid, function(err, poll){
        if(err) return next(err);
        res.render("sharepoll", {poll: poll});
    });
});

//edit poll 
router.post("/users/polls/edit/:pollID", function(req, res, next){
    let pollid = req.params.pollID;
    Poll.findById(pollid, function(err, poll){
        if(err) return next(err);
        res.render("editpoll", {poll: poll});
    });
});

//update poll after edit poll 
router.post("/users/polls/update", function(req, res, next){
    let pollid = req.body.pollID;
    console.log("pollid: ", pollid, req.body);
    Poll.findById(pollid, function(err, poll){
        if(err) return next(err);
        console.log("poll - ", poll);
        poll.name = req.body.pollname;
        //pass values from post to db variables
        poll.question = req.body.question;
        let opts = req.body.opts;
        for (let i=0; i < poll.options.length; i++)
            poll.options[i].option = opts[i];
        if (opts.length > poll.options.length)
            for (let i=poll.options.length; i < opts.length; i++)
            poll.options.push({option: opts[i], votes: 0});
        console.log("updated poll: ", poll);
        poll.save();
        res.redirect("/");
    });
});

router.get("/signup", function(req, res){
    res.render("signup");
});

router.post("/signup", function(req, res, next){
    var username = req.body.username; //body-parser adds the username and pwd to req.body
    var password = req.body.password;
    
    User.findOne({username: username}, function(err, user){ //calls findOne to return just one user on username
        if (err) return next(err);
        if (user) {
            req.flash("error", "User already exists");
            return res.redirect("/signup");
        }
        
        var newUser = new User({
            username: username,
            password: password
        });
        newUser.save(next); //save the new user to db and continues to the next handler
    });
}, passport.authenticate("login", { //authenticate the user
    successRedirect: "/",
    failureRedirect: "/signup",
    failureFlash: true
}));

router.get("/login", function(req, res){
    res.render("login");
})

router.post("/login", passport.authenticate("login", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}));

router.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

router.use(function(req, res, next){
    res.locals.currentUser = req.user; //every view has access to currentUser, pulled from req.user which is populated by Passport
    res.locals.errors = req.flash("error");
    res.locals.infos = req.flash("info");
    next();
})

router.get("/edit", ensureAuthenticated, function(req, res){
    //console.log("ZG inside edit -> displayName = ");
    res.render("edit");
});

router.post("/edit", ensureAuthenticated, function(req, res, next){
    req.user.displayName = req.body.displayname;
    req.user.bio = req.body.bio;
    req.user.save(function(err){
        if(err) {
            next(err);
            return;
        }
        req.flash("info", "Profile updated!");
        res.redirect("/edit");
    });
});

function ensureAuthenticated(req, res, next) {
    console.log("ZG enter ensureAuthenticated");
    if(req.isAuthenticated()) { //a function provided by passport
        console.log("ZG: inside ensureAuthenticated - ", req.isAuthenticated());
        next();
    } else {
        req.flash("info", "You must be logged in to see this page.");
        res.redirect("/login");
    }
}

module.exports = router;

