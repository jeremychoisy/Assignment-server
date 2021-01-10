const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    name : {type: String, required:true},
    author : {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    subject : {type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required:true},
    creationDate: {type: Date, default: Date.now},
    submissionDate: {type: Date, required: true},
    isSubmitted: {type: Boolean, default: false},
    score: {type: Number},
});

module.exports = mongoose.model('Assignment', assignmentSchema);
