const mongoose = require('mongoose');
const formidable = require('formidable');
const formHelper = require('../helpers/formSetup');

const Assignment = mongoose.model( 'Assignment' );
const User = mongoose.model( 'User' );

/**
 * Return assignments related to the user requesting them, based on the JWT payload.
 */
exports.getAssignments = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const pageSize = parseInt(req.query.pagesize) || 10;
        const filter = {$or: [{author: req.user._id}, {'subject.teacher': req.user._id}]}
        const lookupSubject = {
            from: 'subjects',
            localField: 'subject',
            foreignField: '_id',
            as: 'subject'
        };
        const lookupAuthor = {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author'
        };
        const totalCount = await Assignment.aggregate([
            {$lookup: lookupSubject},
            {$match: filter},
            {$count: 'value'}
        ]);
        const assignments = await Assignment.aggregate([
            {$lookup: lookupSubject},
            {$match: filter},
            {$lookup: lookupAuthor},
            {$sort: {submissionDate: -1}},
            {$skip: (page - 1) * pageSize},
            {$limit: pageSize}
        ]);

        // Since aggregate returns an array no matter what,
        // small work around in order to avoid dealing with unnecessary arrays
        assignments.forEach((assignment) => {
            assignment.subject = assignment.subject[0];
            assignment.author = assignment.author[0];
        })

        res.status(200).json({
            assignments,
            totalCount: totalCount[0].value
        });
    } catch (err){
        res.status(500).json({
            message: err.toString()
        });
    }
}

/**
 * Return specific assignment based on the provided id, 404 if not found.
 */
exports.getAssignment = async (req, res) => {
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
    } catch (err){
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
exports.createAssignment = async (req, res) => {
    try {
        const form = new formidable.IncomingForm(), data = {};
        formHelper.formSetup(form, data);
        form.on('error', function(err) {
            res.status(400).json({
                message: err.toString()
            });
        });
        form.on('end', async () => {
            const subjectMembers = await User.find({subjects: data.subject, userLevel: 'student'});
            let nbOfAssignmentsCreated = 0;
            for(const member of subjectMembers) {
                const assignment = await Assignment.create({...data, author: member._id});
                await User.updateOne({_id: member.id}, {$push: {pendingAssignments: assignment._id}});
                nbOfAssignmentsCreated++;
            }
            res.status(200).json({
                nbOfAssignmentsCreated
            });
        });
        form.parse(req);
    } catch ( err ){
        res.status(500).json({
            message: err.toString()
        });
    }
};
