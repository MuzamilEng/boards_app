const express = require("express");
const router = express.Router();
const {
  createBoard,
  getAllBoards,
  getBoardById,
  liveBlockAuth,
  deleteBoard,
  updateBoard,
} = require("../controller/board");

router.route("/getAllboards").get(getAllBoards);
router.route("/api/liveblocks-auth").post(liveBlockAuth);
router.route("/create-board").post(createBoard);
router.route("/deleteBoard/:id").delete(deleteBoard);
router.route("/:id").put(getBoardById);
router.route("/updateBoard/:id").put(updateBoard);
module.exports = router;
