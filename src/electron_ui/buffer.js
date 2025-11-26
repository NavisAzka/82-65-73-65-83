const fs = require("fs");
const path = require("path");

// Lokasi file buffer
const bufferPath = path.join(__dirname, "music_last.txt");

// Pastikan file ada
function ensureFile() {
  if (!fs.existsSync(bufferPath)) {
    fs.writeFileSync(bufferPath, "");
  }
}

// Simpan path musik terakhir
function saveLastMusicPath(filePath) {
  ensureFile();
  try {
    fs.writeFileSync(bufferPath, filePath.trim());
    console.log("💾 Last music saved:", filePath);
  } catch (err) {
    console.error("❌ Gagal menyimpan file buffer:", err);
  }
}

// Ambil path terakhir
function getLastMusicPath() {
  ensureFile();
  try {
    const data = fs.readFileSync(bufferPath, "utf-8").trim();
    return data.length > 0 ? data : null;
  } catch (err) {
    console.error("❌ Gagal membaca file buffer:", err);
    return null;
  }
}

module.exports = {
  saveLastMusicPath,
  getLastMusicPath,
};
