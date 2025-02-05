const controller = require('./controller');
const express = require('express');
const router = express.Router();
const passport = require('passport');

/** GET */
router.get('', passport.authenticate('user-rule', {session: false}), controller.get);
router.get('/root', passport.authenticate('admin-rule', {session: false}), controller.getRoot);
router.get('/:id', passport.authenticate('user-rule', {session: false}), controller.getById);

/** POST */
router.post('', passport.authenticate('admin-rule', {session: false}), controller.create);

/** PATCH */
router.patch('/root/:id', passport.authenticate('admin-rule', {session: false}), controller.updateRoot);
router.patch('/:id', passport.authenticate('user-rule', {session: false}), controller.update)
router.patch('/score/:id', passport.authenticate('admin-rule', {session: false}), controller.updateScore)

/** DELETE */
router.delete('/:id', passport.authenticate('admin-rule', {session: false}), controller.delete);

module.exports = router;
