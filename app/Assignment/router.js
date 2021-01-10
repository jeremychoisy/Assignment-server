const controller = require('./controller');
const express = require('express');
const router = express.Router();
const passport = require('passport');

/** GET */
router.get('', passport.authenticate('user-rule', {session: false}), controller.get);
router.get('/:id', passport.authenticate('user-rule', {session: false}), controller.getById);

/** POST */
router.post('', passport.authenticate('admin-rule', {session: false}), controller.create);

/** PATCH */
router.patch('/:id', passport.authenticate('admin-rule', {session: false}), controller.update);

/** DELETE */
router.delete('/:id', passport.authenticate('admin-rule', {session: false}), controller.delete);

module.exports = router;
