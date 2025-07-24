const mongoose = require ('mongoose')

const Note = new mongoose.model('Note' ,{
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
  title: String, // Ex: "Datas Importantes II Guerra Mundial"
  items: [String], // ["1939 - Inicio da Guerra", "1945 - Fim da Guerra", ...]
  createdAt: { type: Date, default: Date.now }
});

module.exports = Note