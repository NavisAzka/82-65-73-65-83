// bridge.js
export let ros = null;

let connected = false;
let reconnectTimer = null;
let wsUrl =
  `ws://${(typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : 'localhost'}:9090`;

// Simpan subscribe yg diminta user (pending sebelum connect)
const pendingSubs = []; // {name, type, cb}
const activeSubs  = []; // {name, type, cb, topic}

// === Public: ganti URL ws kalau perlu ===
export function setRosUrl(url) {
  wsUrl = url;
  if (ros) {
    try { ros.close(); } catch {}
  }
  connectROS(true);
}

// === Core connect with reconnect ===
function connectROS(force = false) {
  if (connected && !force) return;

  ros = new ROSLIB.Ros({ url: wsUrl });

  ros.on('connection', () => {
    console.log('✅ Connected to ROSBridge:', wsUrl);
    connected = true;
    if (reconnectTimer) { clearInterval(reconnectTimer); reconnectTimer = null; }

    // Flush pending subs (pertama kali connect)
    while (pendingSubs.length) {
      const { name, type, cb } = pendingSubs.shift();
      const topic = new ROSLIB.Topic({ ros, name, messageType: type });
      topic.subscribe(cb);
      activeSubs.push({ name, type, cb, topic });
    }

    // Re-subscribe semua active saat reconnect
    activeSubs.forEach((s, i) => {
      // kalau topic lama ada, putus dulu biar bersih
      try { s.topic && s.topic.unsubscribe && s.topic.unsubscribe(); } catch {}
      const topic = new ROSLIB.Topic({ ros, name: s.name, messageType: s.type });
      topic.subscribe(s.cb);
      activeSubs[i].topic = topic;
    });
  });

  ros.on('error', (err) => {
    console.error('❌ ROSBridge error:', err?.message || err);
  });

  ros.on('close', () => {
    if (connected) console.warn('⚠️ Lost connection to ROSBridge');
    connected = false;

    // jadwalkan reconnect
    if (!reconnectTimer) {
      reconnectTimer = setInterval(() => {
        console.log('🔁 Trying to reconnect:', wsUrl);
        connectROS(true);
      }, 3000);
    }
  });
}

// inisialisasi koneksi
connectROS();

// ==== API Aman ====

// Publish aman (auto no-op jika belum connect)
export function safePublish(name, type, msg) {
  if (!connected || !ros) {
    console.warn(`[ROS] not connected, drop publish → ${name}`);
    return false;
  }
  const topic = new ROSLIB.Topic({ ros, name, messageType: type });
  topic.publish(msg);
  return true;
}

// Dapatkan Topic jika sudah connect (opsional)
export function safeTopic(name, type) {
  if (!connected || !ros) {
    console.warn(`[ROS] not connected, safeTopic null → ${name}`);
    return null;
  }
  return new ROSLIB.Topic({ ros, name, messageType: type });
}

// Subscribe aman: akan di-queue lalu auto aktif saat connect, dan auto re-subscribe saat reconnect
export function safeSubscribe(name, type, cb) {
  if (connected && ros) {
    const topic = new ROSLIB.Topic({ ros, name, messageType: type });
    topic.subscribe(cb);
    activeSubs.push({ name, type, cb, topic });
    return topic;
  }
  // simpan untuk nanti kalau belum connect
  pendingSubs.push({ name, type, cb });
  console.log(`[ROS] queued subscribe → ${name}`);
  return null;
}

// Unsubscribe helper (kalau perlu)
export function safeUnsubscribe(name, cb) {
  for (let i = activeSubs.length - 1; i >= 0; i--) {
    const s = activeSubs[i];
    if (s.name === name && (!cb || cb === s.cb)) {
      try { s.topic && s.topic.unsubscribe && s.topic.unsubscribe(); } catch {}
      activeSubs.splice(i, 1);
    }
  }
}
