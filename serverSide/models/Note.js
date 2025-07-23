const mongoose = require ('mongoose')

const Note = new mongoose.model('Note' ,{
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
  title: String, // Ex: "Fatores"
  items: [String], // ["Crise econômica", "Regimes totalitários", ...]
  createdAt: { type: Date, default: Date.now }
});

module.exports = Note