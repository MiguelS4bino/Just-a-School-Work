const Folder = require("../models/Folder.js");
const Note = require("../models/Note.js");

async function saveOrganizedNotes(userId, organizedJson) {
  for (const folderTitle in organizedJson) {
    // Cria a pasta
    const folder = await Folder.create({
      userId,
      title: folderTitle
    });

    const notes = organizedJson[folderTitle];

    for (const noteTitle in notes) {
      const items = notes[noteTitle];

      await Note.create({
        folderId: folder._id,
        title: noteTitle,
        items: Array.isArray(items)
        ? items.map(item => typeof item === 'object' ? JSON.stringify(item) : String(item))
        : [String(items)]
      });
    }
  }
}

module.exports = saveOrganizedNotes;
