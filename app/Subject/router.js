const controller = require('./controller');
const express = require('express');
const router = express.Router();

router.post('', controller.create);

module.exports = router;
