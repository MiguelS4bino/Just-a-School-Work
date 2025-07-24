const Folder = require("../models/Folder.js");
const Note = require("../models/Note.js");

async function saveOrganizedNotes(userId, organizedJson, text) {
  try {
    const folderTitle = organizedJson.title;
    const notes = organizedJson.notes;

    // Cria a pasta
    const folder = await Folder.create({
      userId,
      title: folderTitle,
      relacionedText: text,
      extractedItems: []
    });

    const noteIds = [];

    // Salva as notas (assumindo notes é array)
    for (const note of notes) {
      const createdNote = await Note.create({
        folderId: folder._id,
        title: note.title,
        items: Array.isArray(note.items) ? note.items : [String(note.items)]
      });
      noteIds.push(createdNote._id);
    }

    folder.extractedItems = noteIds;
    await folder.save();

    return { success: true, folderId: folder._id };
  } catch (error) {
    console.error("Erro ao salvar notas organizadas:", error);
    return { success: false, error: error.message };
  }
}

module.exports = saveOrganizedNotes;
