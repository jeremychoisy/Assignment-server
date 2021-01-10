const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name : {type: String, required:true},
    teacher : {type: mongoose.Schema.Types.ObjectId, ref: 'User', required:true},
    subjectPictureUrl : {type: String, required:true}
});

module.exports = mongoose.model('Subject', subjectSchema);
