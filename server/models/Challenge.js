const mongoose = require ('mongoose')

const challengeSchema = new mongoose.Schema({
    challenger: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    opponent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "rejected", "accepted", "completed"],
        default: "pending"
    },
    "type": {
        type: String,
        enum: ["friend", "casual", "ranked"],
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    finishedAt:{
        type: Date,
        default: null
    }
})

module.exports = mongoose.model('Challenge', challengeSchema);