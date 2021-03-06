const mongoose = require('mongoose');
const formidable = require('formidable');
const formHelper = require('../helpers/formSetup');
const bcrypt = require('bcrypt');

const Assignment = mongoose.model('Assignment');
const User = mongoose.model('User');

/**
 * Returns assignments related to the user requesting them (student or teacher), based on the JWT payload.
 */
exports.get = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const isDone = req.query.isDone ? req.query.isDone.lowercase() === 'true' : false;
        const subjectId = req.query.subjectId;
        const teacherFilter = {$and: [{author: {$ne: req.user._id }}, {subject: subjectId}, {score: {$exists: isDone}}]}
        const studentFilter = {$and: [{author: req.user._id}, {subject: subjectId}, {isSubmitted: isDone}]}
        const filter = req.user.userLevel === 'teacher' ? teacherFilter : studentFilter;

        const totalCount = await Assignment.count(filter);
        const assignments = await Assignment.find(filter)
            .populate('author')
            .sort({submissionDate: -1, 'author.lastName': 1})
            .skip((page - 1) * pageSize)
            .populate('subject');

        res.status(200).json({
            assignments,
            totalCount
        });
    } catch (err) {
        res.status(500).json({
            message: err.toString()
        });
    }
}

/**
 * Returns root assignments related to the teacher requesting them, based on the JWT payload.
 */
exports.getRoot = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const subjectId = req.query.subjectId;
        const filter = {$and: [{author: req.user._id}, {subject: subjectId}]};

        const totalCount = await Assignment.count(filter);
        const assignments = await Assignment.find(filter)
            .sort({submissionDate: -1})
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate('author')
            .populate('subject');

        res.status(200).json({
            assignments,
            totalCount
        });
    } catch (err) {
        res.status(500).json({
            message: err.toString()
        });
    }
}

/**
 * Returns a specific assignment based on the provided id, 404 if not found.
 */
exports.getById = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id)
            .populate('author')
            .populate('subject');

        if (assignment) {
            res.status(200).json({
                assignment
            });
        } else {
            res.status(404).json({
                message: "Assignment not found"
            });
        }
    } catch (err) {
        res.status(500).json({
            message: err.toString()
        });
    }
}

/**
 * Triggers the process of assignments creation :
 * - Queries all the members of the given subject
 * - Creates one assignment per member
 * - Returns the number of assignments created
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
            const subjectMembers = await User.find({subjects: data.subject, userLevel: 'student'});
            let nbOfAssignmentsCreated = 0;
            // Creates a root assignment, authored by the teacher, that'll allow to update/delete all the related assignments if needed.
            const rootAssignment = await Assignment.create({...data, author: req.user._id});
            // Creates one assignment per student
            for (const member of subjectMembers) {
                await Assignment.create({...data, author: member._id, rootAssignment: rootAssignment._id});
                nbOfAssignmentsCreated++;
            }
            res.status(200).json({
                rootAssignment,
                nbOfAssignmentsCreated
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
 * Updates the assignment, based on the given id.
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
            await Assignment.findById(req.params.id);
            let nbOfUpdatedDocuments = 0;
            for (let prop in data) if (data.hasOwnProperty(prop) && prop === 'rootAssignment') delete data[prop];
            await Assignment.updateMany({rootAssignment: req.params.id}, {$set: data})
                .exec(async (err, data) => {
                    if (err) {
                        res.status(400).json({
                            message: err
                        });
                    } else {
                        nbOfUpdatedDocuments = data.nModified;
                    }
                });
            const updatedRootAssignment = await Assignment.findOneAndUpdate({_id: req.params.id}, {$set: data}, {new: true})
                .populate('author')
                .populate('subject');

            res.status(200).json({
                updatedRootAssignment,
                nbOfUpdatedDocuments
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
 * Deletes the assignment, based on the queried id.
 * Requires a valid password from the teacher requesting it, will delete all the created assignment(s).
 * Requires the user level to be 'teacher'.
 */
exports.delete = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        // Checks password
        const result = await bcrypt.compare(req.body.password, user.password);
        if (result) {
            // Deletes all assignments related to the root assignment
            await Assignment.deleteMany({'rootAssignment': req.params.id});
            // Deletes root assignment
            await Assignment.findByIdAndDelete(req.params.id);
            res.status(200).json({
                message: "Assignment deleted"
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
