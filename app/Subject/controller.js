const mongoose = require('mongoose');
const formidable = require('formidable');
const formHelper = require('../helpers/formSetup');
const deleteFileHelper = require('../helpers/deleteFile');

const Subject = mongoose.model('Subject');
const User = mongoose.model('User');
const Assignment = mongoose.model('Assignment');

/**
 * Creates a subject, the teacher requesting it, based on the JWT's payload, will be the one in charge.
 * Requires the user level to be 'teacher'.
 */
exports.create = async (req, res) => {
    try {
        const form = new formidable.IncomingForm(), data = {};
        formHelper.formSetup(form, data);
        form.on('error', function (err) {
            res.status(400).json({
                message: err.toString()
            });
        });
        form.on('end', async () => {
            const subject = await Subject.findOne({name: data.name});
            if (subject) {
                res.status(409).json({
                    message: 'A subject with the same name already exists.'
                });
            } else {
                const subject = await Subject.create({...data, teacher: req.user._id});
                await User.updateOne({_id: req.user._id}, {$push: {subjects: subject._id}});

                res.status(200).json({
                    subject
                });
            }
        });
        form.parse(req);
    } catch (err) {
        res.status(500).json({
            message: err.toString()
        });
    }
};

/**
 * Updates the subject, based on the given id.
 * Requires the user level to be 'teacher'.
 */
exports.update = async (req, res) => {
    try {
        const form = new formidable.IncomingForm(), data = {};
        formHelper.formSetup(form, data);
        form.on('error', function (err) {
            res.status(400).json({
                message: err.toString()
            });
        });
        form.on('end', async () => {
            if (data.subjectPictureUrl) {
                const subject = await Subject.findById(req.params.id);
                if (subject.subjectPictureUrl) {
                    deleteFileHelper.deleteFile(subject.subjectPictureUrl);
                }
            }
            for (let prop in data) if (data.hasOwnProperty(prop) && prop === 'teacher') delete data[prop];
            await Subject.findOneAndUpdate({_id: req.params.id}, {$set: data}, {new: true})
                .populate('teacher')
                .exec(async (err, subject) => {
                    if (err) {
                        res.status(400).json({
                            message: err
                        });
                    } else {
                        res.status(200).json({
                            subject
                        });
                    }
                });
        });
        form.parse(req);
    } catch (err) {
        res.status(500).json({
            message: err.toString()
        });
    }
};

/**
 * Returns all the subjects.
 */
exports.get = async (req, res) => {
    try {
        const subjects = await Subject.find({}).lean();

        const subjectsWithTeacher = [];
        for (const subject of subjects) {
            const teacher = await User.findOne({$and: [{subjects: subject._id},{userLevel: 'teacher'}]});
            subjectsWithTeacher.push({
                ...subject,
                teacher
            });
        }
        res.status(200).json({
            subjects: subjectsWithTeacher
        });
    } catch (err) {
        res.status(500).json({
            message: err.toString()
        });
    }
}

/**
 * Returns the subject based on the queried id.
 */
exports.getById = async (req, res) => {
    try {
        const subjectId = req.params.id;
        const teacher = await User.findOne({$and: [{subjects: subjectId},{userLevel: 'teacher'}]});
        const subject = await Subject.findById(subjectId).lean();
        console.log(subject);
        res.status(200).json({
            subject: {
                ...subject,
                teacher
            }
        });
    } catch (err) {
        res.status(500).json({
            message: err.toString()
        });
    }
}

/**
 * Deletes the subject, based on the queried id.
 * Will delete all the related assignment(s) as well.
 * Requires the user level to be 'teacher'.
 */
exports.delete = async (req, res) => {
    try {
            // Deletes all assignments related to the given subject
            await Assignment.deleteMany({'subject': req.params.id});
            // Removes the subject from the users' subjects array
            await User.updateMany({subjects: req.params.id}, {$pull: {subjects: req.params.id}});
            // Removes the subject from the users' requested subjects array
            await User.updateMany({requestedSubjects: req.params.id}, {$pull: {requestedSubjects: req.params.id}});
            // Delete picture on S3
            const subject = await Subject.findById(req.params.id);
            if (subject.subjectPictureUrl) {
                deleteFileHelper.deleteFile(subject.subjectPictureUrl);
            }
            // Deletes subject
            await Subject.findByIdAndDelete(req.params.id);
            res.status(200).json({
                message: 'Subject deleted'
            })
    } catch (err) {
        res.status(500).json({
            message: err.toString()
        });
    }
};
