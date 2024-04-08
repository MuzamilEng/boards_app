const Board = require("../modal/board");
const { Liveblocks } = require("@liveblocks/node");
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY,
});
const createBoard = async (req, res) => {
  try {
    const { title } = req.body;
    const newBoard = new Board({
      title,
    });
    const savedBoard = await newBoard.save();
    res.status(201).json(savedBoard);
  } catch (error) {
    console.error("Error during board creation:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const liveBlockAuth = async (req, res) => {
  console.log("request");
  const { boardId } = req.query;
  // const boardId = "6603bf37803f93318e31dbc9"

  console.log(boardId, "boardid");

  try {
    // Retrieve the board based on the boardId
    const board = await Board.findById(boardId);
    // Prepare Liveblocks session for the user
    const session = liveblocks.prepareSession(
      `user-${Math.floor(Math.random() * 10)}`,
      {
        boardId: board?._id,
      }
    );
    session.allow(boardId, session.FULL_ACCESS);

    // Authorize the session
    const { status, body } = await session.authorize();
    const data = JSON.parse(body);
    // console.log(data, "data");
    res.status(status).json(data);
  } catch (error) {
    console.error("Error during Liveblocks authentication:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getBoardById = async (req, res) => {
  try {
    const { boardId } = req.params;
    const board = await Board.findById(boardId);
    res.status(200).json(board);
  } catch (error) {
    console.error("Error during board retrieval:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllBoards = async (req, res) => {
  try {
    const boards = await Board.find();
    res.status(200).json(boards);
  } catch (error) {
    console.error("Error during board retrieval:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const deleteBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const dellBoard = await Board.findByIdAndDelete(id);
    if (!dellBoard) {
      return res.status(404).json({ message: "Board not found" });
    }
    res.status(200).json({ message: "Board deleted successfully!" });
  } catch (err) {
    console.error("Error during board retrieval:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const updateBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const updateBoard = await Board.findByIdAndUpdate(
      id,
      { title, description },
      { new: true }
    );
    if (!updateBoard) {
      return res.status(404).json({ message: "Board not found" });
    }
    res.status(200).json(updateBoard);
  } catch (err) {
    console.error("Error during board retrieval:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
module.exports = {
  createBoard,
  getBoardById,
  getAllBoards,
  liveBlockAuth,
  deleteBoard,
  updateBoard
};
