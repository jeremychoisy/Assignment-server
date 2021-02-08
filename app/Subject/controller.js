const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const formidable = require('formidable');
const formHelper = require('../helpers/formSetup');

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
        formHelper.formSetup(form, data, 'subject');
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
        formHelper.formSetup(form, data, 'subject');
        form.on('error', function (err) {
            res.status(400).json({
                message: err.toString()
            });
        });
        form.on('end', async () => {
            const subject = await Subject.findById(req.params.id);
            if (data.subjectPictureUrl) {
                //TODO: Remove AWS S3
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
 * Returns all the subjects managed by the teacher requesting it, based on the JWT's payload.
 * Requires the user level to be 'teacher'.
 */
exports.getByTeacher = async (req, res) => {
    try {
        const subjects = await Subject.find({'teacher': req.user._id})
            .populate('teacher');
        res.status(200).json({
            subjects
        });
    } catch (err) {
        res.status(500).json({
            message: err.toString()
        });
    }
}

/**
 * Returns all the subjects.
 */
exports.get = async (req, res) => {
    try {
        console.log(req.user._id);
        const subjects = await Subject.find({})
            .populate('teacher');
        res.status(200).json({
            subjects
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
        const subject = await Subject.findOne({_id: req.params.id})
            .populate('teacher');
        if (subject) {
            res.status(200).json({
                subject
            });
        } else {
            res.status(404).json({
                message: 'Subject not found'
            });
        }
    } catch (err) {
        res.status(500).json({
            message: err.toString()
        });
    }
}

/**
 * Deletes the subject, based on the queried id.
 * Requires a valid password from the teacher requesting it, will delete all the related assignment(s) as well.
 * Requires the user level to be 'teacher'.
 */
exports.delete = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        // Checks password
        const result = await bcrypt.compare(req.body.password, user.password);
        if (result) {
            // Deletes all assignments related to the given subject
            await Assignment.deleteMany({'subject': req.params.id});
            // Removes the subject from the users' subjects array
            await User.updateMany({subjects: req.params.id}, {$pull: {subjects: req.params.id}});
            // Deletes subject
            await Subject.findByIdAndDelete(req.params.id);
            res.status(200).json({
                message: "Subject deleted"
            })
        } else {
            res.status(400).json({
                message: "Incorrect password"
            })
        }
    } catch (err) {
        res.status(500).json({
            message: err.toString()
        });
    }
};
