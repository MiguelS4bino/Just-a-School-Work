const mongoose = require ('mongoose')
const Note = require('../models/Note')

const Folder = mongoose.model('Folder', {
    userId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    title: String,
    relacionedText: String,
    extractedItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note'
    }],
    createdAt: {
        type: Date, default: Date.now
    },
})

module.exports = Folder