const mongoose = require('mongoose');
const express = require('express');

const boardSchema = new mongoose.Schema({
    // boardId: String,
    boardTitle: String,
})

const Board = mongoose.model('Board', boardSchema);

module.exports = Board