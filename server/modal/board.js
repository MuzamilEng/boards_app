const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema(
  {
    boardTitle: String,
  },
  { timestamps: true } // Add timestamps option here
);

const Board = mongoose.model("Board", boardSchema);

module.exports = Board;
