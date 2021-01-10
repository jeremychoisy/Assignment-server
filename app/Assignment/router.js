const controller = require('./controller');
const express = require('express');
const router = express.Router();
const passport = require('passport');

router.get('/:id', controller.getAssignment);
router.get('', passport.authenticate('user-rule', {session: false}), controller.getAssignments);

router.post('', controller.createAssignment);

module.exports = router;
