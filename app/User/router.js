const controller = require('./controller');
const express = require('express');
const router = express.Router();

router.post('', controller.create);
router.post('/log-in', controller.logIn);

module.exports = router;
