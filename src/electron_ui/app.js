// =============================================================================
// ✅ ROS WRAPPER SETUP
// =============================================================================

const camera_path = "http://localhost:8080/stream?topic=/vision/image_display";
const ASSETS_PATH = "assets/";

import { safeTopic, safePublish, safeSubscribe } from "./bridge.js";



// =============================================================================
// 🧹 SOCKET CLEANUP
// =============================================================================

let activeSocket = null;

function cleanupSocket() {
  if (activeSocket) {
    activeSocket.close();
    activeSocket = null;
  }
}

// =============================================================================
// 🧭 NAVIGATION HANDLER
// =============================================================================

const navButtons = document.querySelectorAll(".nav-btn[data-page]");
const pages = document.querySelectorAll(".page");
let currentPage = "konten";

function showPage(targetId) {
  pages.forEach((page) =>
    page.classList.toggle("active", page.id === targetId)
  );
  navButtons.forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.page === targetId)
  );
  currentPage = targetId;
}

navButtons.forEach((btn) =>
  btn.addEventListener("click", () => showPage(btn.dataset.page))
);

// =============================================================================
// ➕ ADD BUTTON HANDLER
// =============================================================================

const addBtn = document.getElementById("add-btn");
const contentGrid = document.getElementById("content-grid");
const foodGrid = document.getElementById("food-grid");

let contentCount = 1;
let foodCount = 1;

if (addBtn) {
  addBtn.addEventListener("click", () => {
    currentPage === "konten" ? addContent() : addFood();
  });
}

// Smooth card appear animation
function animateCard(card) {
  card.style.opacity = "0";
  card.style.transform = "scale(0.9)";
  requestAnimationFrame(() => {
    card.style.transition = "all .25s ease";
    card.style.opacity = "1";
    card.style.transform = "scale(1)";
  });
}

// Create content card (4x6)
function addContent() {
  contentCount++;
  const card = document.createElement("div");
  card.className = "card konten";
  card.dataset.type = "image";
  card.dataset.src = "assets/poster.jpg";
  card.innerHTML = `
    <img src="assets/content.jpeg" alt="Content ${contentCount}" />
    <div class="card-info">
      <h3>Content Title ${contentCount}</h3>
      <p>Dari JS handler</p>
    </div>
  `;
  contentGrid.appendChild(card);
  animateCard(card);
}

// Create food card (1x1)
function addFood() {
  foodCount++;
  const card = document.createElement("div");
  card.className = "card makanan";
  card.dataset.type = "image";
  card.dataset.src = "assets/food.jpeg";
  card.innerHTML = `
    <img src="assets/food.jpeg" alt="Makanan ${foodCount}" />
    <div class="overlay">Makanan ${foodCount}</div>
  `;
  foodGrid.appendChild(card);
  animateCard(card);
}

// =============================================================================
// 📄 LOAD FOOD DESCRIPTIONS FROM FILE
// =============================================================================

let foodDescriptions = [];
let foodSpecs = [];

async function loadFoodDescriptions() {
  try {
    const response = await fetch("assets/food_description.txt");
    const text = await response.text();

    // Split by separator "||||"
    foodDescriptions = text
      .split("||||")
      .map((desc) => desc.trim())
      .filter((desc) => desc.length > 0);

    console.log(`✅ Loaded ${foodDescriptions.length} food descriptions`);
  } catch (error) {
    console.error("❌ Failed to load food descriptions:", error);
    foodDescriptions = [];
  }
}

async function loadFoodSpecs() {
  try {
    const response = await fetch("config/food_specs.json");
    foodSpecs = await response.json();
    console.log(`✅ Loaded ${foodSpecs.length} food specifications`);
  } catch (error) {
    console.error("❌ Failed to load food specs:", error);
    foodSpecs = [];
  }
}

// Load descriptions and specs on page load
loadFoodDescriptions();
loadFoodSpecs();

// =============================================================================
// 👁️ VIEWER OVERLAY HANDLER
// =============================================================================

const viewerOverlay = document.getElementById("viewer-overlay");
const viewerContent = document.getElementById("viewer-content");
const viewerClose = document.getElementById("viewer-close");

// saat viewer dibuka -> mute
if (viewerOverlay) {
  const observer = new MutationObserver(() => {
    const isVisible = !viewerOverlay.classList.contains("hidden");
    if (isVisible) muteBGM();
    else restoreBGM();
  });

  observer.observe(viewerOverlay, { attributes: true, attributeFilter: ["class"] });
}

// --- promo video overlay juga
const promoOverlay = document.getElementById("promo-overlay");
if (promoOverlay) {
  const promoObserver = new MutationObserver(() => {
    const isVisible = !promoOverlay.classList.contains("hidden");
    if (isVisible) muteBGM();
    else restoreBGM();
  });

  promoObserver.observe(promoOverlay, { attributes: true, attributeFilter: ["class"] });
}


function openViewer(type, src, cardData = null) {
  // Clean up any previous viewer state first
  viewerOverlay.classList.remove("hidden", "food-detail", "promo");
  viewerContent.innerHTML = "";

  let el;

  switch (type) {
    case "food-detail":
      viewerOverlay.classList.add("food-detail");
      el = createFoodDetailView(cardData);
      break;

    case "youtube":
    case "web":
    case "html":
      el = document.createElement("webview");
      el.src = src;
      Object.assign(el.style, { width: "100%", height: "100%" });
      break;

    case "pdf":
      el = document.createElement("iframe");
      el.src = src;
      el.style.width = "100%";
      el.style.height = "100%";
      break;

    case "video":
      el = document.createElement("video");
      el.src = src;
      el.controls = true;
      el.autoplay = true;
      el.muted = true;
      el.playsInline = true;
      Object.assign(el.style, { width: "100%", height: "100%" });
      el.oncanplay = () => {
        el.play().catch(() => {});
        el.muted = false;
      };
      break;

    case "mjpeg":
      el = document.createElement("img");
      el.src = src;
      Object.assign(el.style, {
        width: "100%",
        height: "100%",
        objectFit: "contain",
      });
      break;

    default:
      el = document.createElement("img");
      el.src = src;
      el.style.width = "100%";
      el.style.height = "100%";
  }

  viewerContent.appendChild(el);
  viewerOverlay.classList.remove("hidden");
}

function createFoodDetailView(data) {
  const container = document.createElement("div");
  container.className = "food-detail-container";

  // Get description from data or use default
  const description = data.description || "Deskripsi tidak tersedia.";

  // Get ingredients (already an array from JSON)
  const ingredients = Array.isArray(data.ingredients)
    ? data.ingredients
    : data.ingredients
    ? data.ingredients.split(",").map((item) => item.trim())
    : [];

  container.innerHTML = `
    <div class="food-detail-grid">
      <div class="food-image-container">
        <img src="${data.image}" alt="${data.name}">
      </div>
      <div class="food-specs-container">
        <h1>${data.name}</h1>
        <div class="food-spec-item">
          <span class="food-spec-label">💰 Harga</span>
          <span class="food-spec-value">${data.price}</span>
        </div>
        <div class="food-ingredients-card">
          <h3>🥘 Bahan-Bahan</h3>
          <ul class="ingredients-list">
            ${ingredients
              .map((ingredient) => `<li>${ingredient}</li>`)
              .join("")}
          </ul>
        </div>
      </div>
    </div>
    <div class="food-description-container">
      <h2>📝 Deskripsi</h2>
      <p>${description}</p>
    </div>
  `;

  return container;
}

// Single event listener for all cards
document.addEventListener("click", (e) => {
  const card = e.target.closest(".card.konten, .card.makanan");
  if (!card) return;

  if (
    card.classList.contains("makanan") &&
    card.dataset.type === "food-detail"
  ) {
    // Get the food index (0-based)
    const foodIndex = Array.from(card.parentElement.children).indexOf(card);

    // Get specs from JSON if available
    const specs = foodSpecs[foodIndex];

    if (!specs) {
      console.error(`❌ No food specs found for index ${foodIndex}`);
      return;
    }

    const foodData = {
      ...specs,
      // Use loaded description if available
      description: foodDescriptions[foodIndex] || "Deskripsi tidak tersedia.",
    };

    console.log("📦 Opening food detail:", foodData);
    openViewer("food-detail", null, foodData);
  } else {
    openViewer(card.dataset.type, card.dataset.src);
  }
});

function closeViewer() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }

  // Add hidden class first
  viewerOverlay.classList.add("hidden");

  // Remove all viewer type classes
  viewerOverlay.classList.remove("food-detail", "promo");

  // Clear content
  viewerContent.innerHTML = "";

  console.log("✅ Viewer closed");
}

viewerClose.addEventListener("click", (e) => {
  e.stopPropagation();
  closeViewer();
});

viewerOverlay.addEventListener("click", (e) => {
  if (e.target === viewerOverlay) {
    closeViewer();
  }
});

// =============================================================================
// 📷 CAMERA VIEWER
// =============================================================================

document.getElementById("camera-btn").addEventListener("click", () => {
  // const host = window.location.hostname;
  if (!safeTopic("/ui/check_connection", "std_msgs/Empty")) {
    alert("ROS belum terkoneksi ⚠️");
    return;
  }
  const url = camera_path;
  openViewer("mjpeg", url);
});

// =============================================================================
// 🎥 PROMO VIDEO MODE
// =============================================================================

const promoPlaylist = [
  "assets/RAISA_1.mp4",
  "assets/ROBOT AI_1.mp4",
  "assets/ROBOT robot anjing berkaki 4.mp4",
  "assets/TEASER 1 RAISA 2.0.mp4",
];
const promoBtn = document.getElementById("promo-btn");

promoBtn.addEventListener("click", () => openPromoVideo(promoPlaylist));

function openPromoVideo(playlist, index = 0) {
  const viewer = viewerOverlay;
  const videoPath = playlist[index];

  viewer.classList.remove("hidden");
  viewer.classList.add("promo");

  const viewerHeader = document.querySelector(".viewer-header");
  if (viewerHeader) viewerHeader.style.display = "none";

  viewerContent.innerHTML = `
    <video id="promo-video" autoplay playsinline muted>
      <source src="${videoPath}" type="video/mp4">
    </video>
    <button id="promo-close">✕</button>
  `;

  const video = document.getElementById("promo-video");
  const closeBtn = document.getElementById("promo-close");
  closeBtn.classList.add("visible");
  let hideTimeout = null;

  video.play().catch(() => {});
  video.muted = false;

  video.onended = () => {
    const next = (index + 1) % playlist.length;
    openPromoVideo(playlist, next);
  };

  viewer.addEventListener("click", () => {
    closeBtn.classList.add("visible");
    clearTimeout(hideTimeout);
    // hideTimeout = setTimeout(() => {
    //   closeBtn.classList.remove("visible");
    // }, 3000);
  });

  closeBtn.addEventListener("click", closePromo);
}

function closePromo() {
  viewerOverlay.classList.add("hidden");
  viewerOverlay.classList.remove("promo");
  viewerContent.innerHTML = "";

  const viewerHeader = document.querySelector(".viewer-header");
  if (viewerHeader) viewerHeader.style.display = "block";
}

// =============================================================================
// 🗣 ABOUT ME BUTTON
// =============================================================================

const aboutBtn = document.getElementById("about-btn");
const aboutOverlay = document.getElementById("about-overlay");
const aboutClose = document.getElementById("about-close");

function sendAboutMe(data_send = 1) {
  const topic = safeTopic("/ui/about_me", "std_msgs/Int8");
  if (topic) topic.publish({ data: data_send });
  else alert("ROS belum terkoneksi ⚠️");
}

aboutBtn.addEventListener("click", () => {
  aboutOverlay.classList.remove("hidden");
  sendAboutMe(1);
});

aboutClose.addEventListener("click", () => {
  aboutOverlay.classList.add("hidden");
  sendAboutMe(0);
});

// =============================================================================
// Charge Docking BUTTON
// =============================================================================

// ====== ELEMENT ======
const dockingBtn = document.getElementById("docking-btn");
const dockingOverlay = document.getElementById("docking-overlay");
const dockingMessage = document.getElementById("docking-message");
const dockingCancel = document.getElementById("docking-cancel");
const dockingClose = document.getElementById("docking-close");

// ====== BUTTON EVENT ======
dockingBtn.addEventListener("click", () => {
  sendGotoDocking();
});

// ====== FUNCTION ======
function sendGotoDocking() {
  const topic = safeTopic("/ui/goto_docking", "std_msgs/Int8");
  if (!topic) {
    alert("ROS belum terkoneksi ⚠️");
    return;
  }

  // tampilkan overlay
  dockingOverlay.classList.remove("hidden");
  dockingMessage.textContent = "Sedang menuju charging pile!";
  dockingCancel.classList.remove("hidden");
  dockingClose.classList.add("hidden");

  // kirim command
  topic.publish({ data: 1 });
  console.log("🚀 Docking command sent via safeTopic()");
}

// ====== CANCEL BUTTON ======
dockingCancel.addEventListener("click", () => {
  const cancelTopic = safeTopic("/ui/goto_docking", "std_msgs/Int8");
  if (cancelTopic) cancelTopic.publish({ data: 0 });
  console.log("🛑 Docking canceled via safeTopic()");
  dockingOverlay.classList.add("hidden");
});

// ====== CLOSE BUTTON ======
dockingClose.addEventListener("click", () => {
  dockingOverlay.classList.add("hidden");
});

// ====== ROS SUBSCRIBE (docking status) ======'

// subscribe docking status — dijamin aktif saat connect, dan auto re-subscribe saat reconnect
safeSubscribe("/communication/docking_status", "std_msgs/Int8", (msg) => {
  console.log("Docking status:", msg.data);
  if (msg.data === 1) {
    dockingMessage.textContent = "✅ DOCKING CHARGE SUKSES!";
    dockingCancel.classList.add("hidden");
    dockingClose.classList.remove("hidden");
  } else if (msg.data === -1) {
    dockingMessage.textContent = "❌ Docking Gagal. Silakan coba lagi.";
    dockingCancel.classList.add("hidden");
    dockingClose.classList.remove("hidden");
  }
});

// =============================================================================
// 🔋 BATTERY STATUS DISPLAY
// =============================================================================

const batteryPercentText = document.getElementById("battery-percent");
const batteryLevel = document.getElementById("battery-level");
const batteryStatus = document.getElementById("battery-status");

// Default visual
updateBatteryUI(0);

safeSubscribe(
  "/communication/robot_battery_status",
  "std_msgs/Float32",
  (msg) => {
    const percent = Math.max(0, Math.min(100, msg.data)); // clamp 0–100
    updateBatteryUI(percent);
  }
);

function updateBatteryUI(percent) {
  batteryLevel.style.width = `${percent}%`;
  batteryPercentText.textContent = `${percent.toFixed(0)}%`;

  batteryStatus.classList.remove(
    "battery-low",
    "battery-medium",
    "battery-high"
  );

  if (percent < 25) {
    batteryStatus.classList.add("battery-low");
  } else if (percent < 75) {
    batteryStatus.classList.add("battery-medium");
  } else {
    batteryStatus.classList.add("battery-high");
  }
}
// =============================================================================
// 🎵 BACKGROUND MUSIC PLAYER
// =============================================================================

const fs = require("fs");
const path = require("path");

// Lokasi buffer file
const bufferPath = path.join(__dirname, "music_last.txt");

// ==== FUNGSI BUFFER ====
function ensureFile() {
  if (!fs.existsSync(bufferPath)) {
    fs.writeFileSync(bufferPath, "");
  }
}

function saveLastMusicPath(filePath) {
  ensureFile();
  fs.writeFileSync(bufferPath, filePath.trim());
  console.log("💾 Last music saved:", filePath);
}

function getLastMusicPath() {
  ensureFile();
  const data = fs.readFileSync(bufferPath, "utf-8").trim();
  return data.length > 0 ? data : null;
}

// ==== DAFTAR MUSIK ====
const MUSIC_LIST = [
  //  src/electron_ui/assets/music/music-rek-ayo-rek.mp3
  "- - Stop Music - -",
  "assets/music/rek-ayo-rek.mp3",
  "assets/music/Foreplay-Fourplay-Cultura-Jazz.mp3",
  "assets/music/Hymne-ITS.mp3",
  "assets/music/IBU-PERTIWI.mp3",
  "assets/music/Jazz-Music.mp3",
  "assets/music/Liebesleid-(Love's-Sorrow)-Kreisler-Rousseau.mp3",
  "assets/music/Max-O-Man-Fourplay-Cultura-Jazz.mp3",
  // Tambahkan musik lain di sini
];

// ==== ELEMENT DOM ====
const musicOverlay = document.getElementById("music-overlay");
const musicList = document.getElementById("music-list");
const musicClose = document.getElementById("music-close");
const musicBtn = document.getElementById("music-btn");
const bgmPlayer = document.getElementById("bgm-player");

// =============================================================================
//  BGM
// =============================================================================
let bgmPrevVolume = bgmPlayer.volume; // simpan volume sebelumnya

function muteBGM() {
  if (!bgmPlayer.paused) {
    bgmPrevVolume = bgmPlayer.volume;
    bgmPlayer.volume = 0;
    console.log("🔇 BGM muted");
  }
}

function restoreBGM() {
  if (bgmPlayer.src && bgmPlayer.volume === 0) {
    bgmPlayer.volume = bgmPrevVolume;
    console.log("🔊 BGM restored");
  }
}

// ==== EVENT: buka overlay saat tombol ditekan ====
musicBtn.addEventListener("click", () => {
  musicOverlay.classList.remove("hidden");
  renderMusicList();
});

// ==== EVENT: tutup overlay ====
musicClose.addEventListener("click", () => {
  musicOverlay.classList.add("hidden");
});

// ==== RENDER LIST LAGU ====
function renderMusicList() {
  musicList.innerHTML = "";
  MUSIC_LIST.forEach((path) => {
    const name = path.split("/").pop().replace(/\.[^/.]+$/, "");
    const li = document.createElement("li");
    li.textContent = name;
    li.classList.add("music-item");

    li.addEventListener("click", () => playMusic(path, li));
    musicList.appendChild(li);
  });

  // tandai lagu terakhir dari buffer
  const last = getLastMusicPath();
  if (last) {
    const lastLi = [...musicList.children].find(
      (li) => li.textContent === last.split("/").pop().replace(/\.[^/.]+$/, "")
    );
    if (lastLi) lastLi.classList.add("active");
  }
}

// ==== PLAY FUNCTION ====
function playMusic(filePath, li) {
  bgmPlayer.src = filePath;
  bgmPlayer.loop = true;
  bgmPlayer.volume = 0.7;

  bgmPlayer.play().catch((err) => {
    console.warn("⚠️ Autoplay blocked:", err);
  });

  // update UI
  document.querySelectorAll(".music-item").forEach((el) => el.classList.remove("active"));
  if (li) li.classList.add("active");

  // simpan ke file buffer
  saveLastMusicPath(filePath);
  console.log(`🎧 Playing ${filePath}`);
}

// ==== AUTOPLAY SAAT UI DIBUKA ====
window.addEventListener("DOMContentLoaded", () => {
  const last = getLastMusicPath();
  if (last && fs.existsSync(path.join(__dirname, last)) && MUSIC_LIST.includes(last)) {
    playMusic(last, null);
  }
});


// =============================================================================
// ✅ STATUS LOG
// =============================================================================
console.log("✅ Futuristic Robot UI Initialized");
