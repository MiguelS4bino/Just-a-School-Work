const mongoose = require ('mongoose')

const Folder = mongoose.model('Folder', {
    userId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    title: String,
    createdAt: {
        type: Date, default: Date.now
    }
})

module.exports = Folder