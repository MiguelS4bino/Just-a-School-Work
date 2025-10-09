const mongoose = require ('mongoose')

const Note = new mongoose.model('Note', {
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
  title: String,
  items: [String],
  images: [{ type: String }], // caminhos das imagens
  files: [{ type: String }],  // caminhos de arquivos PDF, docs etc.
  createdAt: { type: Date, default: Date.now }
});


module.exports = Note