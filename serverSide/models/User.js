const mongoose = require ('mongoose')

const User = mongoose.model('User', {
    nickname: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    level: {type: Number, default: 1},
    rank: {type: String, enum:['Non-Rank', 'Bronze3', 'Bronze2', 'Bronze1', 'Silver3', 'Silver2', 'Silver1', 'Gold3', 'Gold2', 'Gold1', 'Platinum3', 'Platinum2', 'Platinum1', 'Diamond3', 'Diamond2', 'Diamond1', 'Savant3', 'Savant2', 'Savant1', 'The Elder'], default:'Non-Rank'},
    xp: {type: Number, default: 0},
    img: {type: String, default: "https://i0.wp.com/digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png?fit=500%2C500&ssl=1"},
    folders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder'
    }]
})

module.exports = User