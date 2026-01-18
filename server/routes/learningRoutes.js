const express = require('express');
const router = express.Router();
const { getProblem, submitAnswer, getUserStatus } = require('../controllers/learningController');

router.get('/problem', getProblem);
router.post('/submit', submitAnswer);
router.get('/status', getUserStatus);

module.exports = router;
