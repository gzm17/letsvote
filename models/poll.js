var mongoose = require("mongoose");
var User = require("../models/user");

//This defines the user schema for mongoose
var pollSchema = mongoose.Schema({
    name: {type: String, required: true},
    question: {type: String, required: true},
    status: {type: String, enum: ["open", "closed", "pre-open"], default: "pre-open"},
    options: [{
        option: {type: String, required: true},
        votes: {type: Number, default: 0},
    }],
    votes: {type: Number, default: 0}, //total number of votes so far
    createdAt: {type: Date, default: Date.now},
    publishedAt: {type: Date, default: Date.now},
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    info: String //other info on the poll
});

var noop = function () {}; //this function does nothing - dont know why it is needed

//adding a method to userSchema to check user pwd
pollSchema.methods.getPollSummary = function(){
    var summary = {
        name: this.name,
        question: this.question,
        votes: this.votes,
        status: this.status
    };
    return summary;
};

//adding a method to get user name to the schema
pollSchema.methods.getPoll = function (){
    return this; 
};

var Poll = mongoose.model("Poll", pollSchema);


module.exports = Poll;


