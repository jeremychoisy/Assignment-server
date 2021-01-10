const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const key = require('../../config/jwtKeys');
const formidable = require('formidable');
const formHelper = require('../helpers/formSetup');
const fileHelper = require('../helpers/deleteFile');
const passport = require('passport');


const User = mongoose.model('User');
const Assignment = mongoose.model('Assignment')

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Creates a user and returns it (without the password)
 */
exports.create = async (req, res) => {
    try {
        const form = new formidable.IncomingForm(), data = {};
        formHelper.formSetup(form, data, 'avatar');
        form.on('error', function (err) {
            res.status(400).json({
                message: err.toString()
            });
        });
        form.on('end', async () => {
            const user = await User.findOne({email: data.email});
            if (user) {
                res.status(409).json({
                    message: 'Email already used.'
                });
            } else {
                data.password = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);
                const user = await User.create(data);

                for (let prop in user) if (user.hasOwnProperty(prop) && prop === 'password') delete user[prop];

                res.status(200).json({
                    user: user
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
 * Logs in through passport.js. If successful, generates a JWT containing the user's email and the user's level as payload
 * and returns both the token and the user.
 */
exports.logIn = (req, res) => {
    try {
        passport.authenticate('login', {session: false}, (err, user, info) => {
            if (err || !user) {
                return res.status(info.code).json({
                    message: info ? info.message : 'Login failed',
                });
            }
            req.logIn(user, {session: false}, async (err) => {
                if (err) {
                    throw err.toString();
                }
                const token = jwt.sign({email: user.email, admin: user.userLevel === 'teacher'}, key.secretKey);
                const foundUser = await User.findOne({email: req.body.email})
                    .select('name lastName email avatarUrl creationDate pendingAssignments submittedAssignments userLevel')
                    .populate({
                        path: 'pendingAssignments',
                        options: {sort: {creationDate: -1}},
                        populate: {path: 'subject'}
                    })
                    .populate({
                        path: 'submittedAssignments',
                        options: {sort: {creationDate: -1}},
                        populate: {path: 'subject'}
                    })
                    .populate('subjects');
                res.status(200).json({
                    user: foundUser,
                    token: token
                });
            })
        })
        (req, res);
    } catch (err) {
        res.status(500).json({
            message: err.toString()
        });
    }
};

/**
 * Updates the user requesting it, based on the JWT's payload.
 */
exports.update = async (req, res) => {
    try {
        const form = new formidable.IncomingForm(), data = {};
        formHelper.formSetup(form, data, 'avatar');
        const allowedUpdates = ['name', 'lastName', 'avatarUrl'];
        form.on('error', function (err) {
            res.status(400).json({
                message: err.toString()
            });
        });
        form.on('end', async () => {
            const user = await User.findById(req.user._id);
            if (data.avatarUrl) {
                fileHelper.deleteFile(user.avatarUrl, 'avatar');
            }
            for (let prop in data) if (data.hasOwnProperty(prop) && !allowedUpdates.includes(prop)) delete data[prop];
            await User.findOneAndUpdate({_id: req.user._id}, {$set: data},
                {
                    fields: '-password',
                    new: true
                }
            )
                .populate({
                    path: 'pendingAssignments',
                    options: {sort: {creationDate: -1}},
                    populate: {path: 'subject'}
                })
                .populate({
                    path: 'submittedAssignments',
                    options: {sort: {creationDate: -1}},
                    populate: {path: 'subject'}
                })
                .populate('subjects')
                .exec(async (err, user) => {
                    if (err) {
                        res.status(400).json({
                            message: err
                        });
                    } else {
                        res.status(200).json({
                            user
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
 * Returns the user based on the queried id.
 */
exports.get = async (req, res) => {
    try {
        const user = await User.findOne({_id: req.params.id})
            .select('-password')
            .populate({path: 'pendingAssignments', options: {sort: {creationDate: -1}}, populate: {path: 'subject'}})
            .populate({path: 'submittedAssignments', options: {sort: {creationDate: -1}}, populate: {path: 'subject'}})
            .populate('subjects');

        if (user) {
            res.status(200).json({
                user
            });
        } else {
            res.status(404).json({
                message: 'User not found'
            });
        }
    } catch (err) {
        res.status(500).json({
            message: err.toString()
        });
    }
}

/**
 * Returns the students being part of a specific subject, based on the subject id provided.
 */
exports.getForSubject = async (req, res) => {
    try {
        const users = await User.find({subjects: req.params.id})
            .select('-password')
            .sort({lastName: 1})
            .populate({path: 'pendingAssignments', options: {sort: {creationDate: -1}}, populate: {path: 'subject'}})
            .populate({path: 'submittedAssignments', options: {sort: {creationDate: -1}}, populate: {path: 'subject'}})
            .populate('subjects');

        res.status(200).json({
            users
        });
    } catch (err) {
        res.status(500).json({
            message: err.toString()
        });
    }
}

/**
 * Deletes the user requesting it, based on the JWT's payload.
 * Requires a valid password, will delete the user's assignment(s) as well.
 */
exports.delete = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        // check password
        const result = await bcrypt.compare(req.body.password, user.password);
        if (result) {
            // Delete user's assignments
            await Assignment.deleteMany({'author': user._id});
            // Delete user
            await User.findByIdAndDelete(user._id);
            res.status(200).json({
                message: "User deleted"
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
