const express = require('express');
const router = express.Router();
const { createBoard, getAllBoards, getBoardById, liveBlockAuth } = require('../controller/board');


router.route('/getAllboards').get(getAllBoards)
router.route('/api/liveblocks-auth').post(liveBlockAuth)
router.route('/create-board').post(createBoard);

router.route('/:id').put(getBoardById);

module.exports = router;
