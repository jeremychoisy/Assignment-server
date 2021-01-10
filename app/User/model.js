const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    lastName: {type: String, required: true},
    password: {type: String, required: true},
    creationDate: {type: Date, default: Date.now},
    email: {type: String, required: true},
    avatarUrl: {type: String},
    subjects: [{type: mongoose.Schema.Types.ObjectId, ref: 'Subject'}],
    pendingAssignments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Assignment'}],
    submittedAssignments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Assignment'}],
    userLevel: {type: String, enum: ['teacher', 'student'], default: 'student'}
});

module.exports = mongoose.model('User', userSchema);
