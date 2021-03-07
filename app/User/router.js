const controller = require('./controller');
const express = require('express');
const passport = require('passport');
const router = express.Router();

/** GET */
router.get('/subject/:id', passport.authenticate('user-rule', {session: false}), controller.getForSubject);
router.get('/:id', passport.authenticate('user-rule', {session: false}), controller.get);

/** POST */
router.post('', controller.create);
router.post('/log-in', controller.logIn);

/** PATCH */
router.patch('', passport.authenticate('user-rule', {session: false}), controller.update);
router.patch('/apply', passport.authenticate('user-rule', {session: false}), controller.applyStudent);
router.patch('/approve/:id', passport.authenticate('admin-rule', {session: false}), controller.approveStudent);
router.patch('/decline/:id', passport.authenticate('admin-rule', {session: false}), controller.declineStudent);

/** DELETE */
router.delete('', passport.authenticate('user-rule', {session: false}), controller.delete);

module.exports = router;
