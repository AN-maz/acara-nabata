/* Papan Kinerja Panitia — render kanban, modal detail, rekap kehadiran.
   Semua data dibaca dari file JSON (data/tasks.json & data/attendance.json). */

const STATUS_META = {
  todo: { label: "To Do", cls: "todo" },
  in_progress: { label: "In Progress", cls: "progress" },
  done: { label: "Done", cls: "done" },
};

const $ = (sel) => document.querySelector(sel);

let tasks = [];
let team = [];
let attendance = null;
let meetings = [];
let rundownItems = [];

const DAY_MS = 86400000; // 24 jam — ambang "tinggal 1 hari" buat popup

/* ---------- icon (SVG stroke ala Lucide, gaya icon di React) ---------- */
const svg = (paths, size = 14) =>
  `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" ` +
  `stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ` +
  `aria-hidden="true">${paths}</svg>`;

const ICON = {
  clock: svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  calendar: svg(
    '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>' +
      '<line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'
  ),
  pin: svg('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'),
  alarm: svg(
    '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/>'
  ),
  clipboard: svg(
    '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>'
  ),
};

/* varian tanpa margin (buat di dalam tombol/kotak) */
const ICON_X =
  '<svg class="ico ico-plain" width="15" height="15" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
  '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
const ICON_CHECK =
  '<svg class="ico ico-plain" width="12" height="12" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" ' +
  'aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

/* ---------- util ---------- */
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(t) {
  if (t.status === "done" || !t.deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dl = new Date(t.deadline + "T00:00:00");
  return !Number.isNaN(dl.getTime()) && dl < today;
}

function initials(name) {
  return (name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

/* ---------- stats ---------- */
function renderStats() {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const doing = tasks.filter((t) => t.status === "in_progress").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const att = attendanceSummary();
  const overdue = tasks.filter((t) => isOverdue(t)).length;
  const cards = [
    { label: "Total Tugas", value: total, bar: null },
    { label: "Selesai", value: `${pct}<small>%</small>`, bar: pct },
    { label: "Sedang Dikerjakan", value: doing, bar: null },
    { label: "Tugas Terlambat", value: overdue, bar: null, warn: overdue > 0 },
    { label: "Anggota Tim", value: team.length || attendance?.members?.length || 0, bar: null },
    { label: "Kehadiran Rata-rata", value: `${att.avg}<small>%</small>`, bar: att.avg },
  ];

  $("#stats").innerHTML = cards
    .map(
      (c) => `
      <div class="stat">
        <div class="label">${c.label}</div>
        <div class="value${c.warn ? " warn" : ""}">${c.value}</div>
        ${c.bar !== null ? `<div class="bar"><span style="width:${c.bar}%"></span></div>` : ""}
      </div>`
    )
    .join("");
}

/* ---------- kanban ---------- */
function cardEl(t) {
  const cl = t.checklist || [];
  const okCount = cl.filter((c) => c.done).length;
  const clPct = cl.length ? Math.round((okCount / cl.length) * 100) : 0;
  const overdue = isOverdue(t);

  const el = document.createElement("button");
  el.type = "button";
  el.className = `card p-${t.priority || "medium"}`;
  el.innerHTML = `
    <div class="title">${esc(t.title)}</div>
    <div class="meta">
      <span class="badge">${esc(t.division || "Tanpa divisi")}</span>
      <span class="avatar" title="${esc(t.pic)}">${initials(t.pic)}</span>
      <span>${esc(t.pic || "—")}</span>
      ${overdue ? '<span class="badge overdue">Terlambat</span>' : `<span>${ICON.clock}${fmtDate(t.deadline)}</span>`}
    </div>
    ${
      cl.length
        ? `<div class="progress-mini">
             <div class="track"><span style="width:${clPct}%"></span></div>
             <span>${okCount}/${cl.length}</span>
           </div>`
        : ""
    }`;
  el.addEventListener("click", () => openModal(t));
  return el;
}

function renderBoard() {
  const board = $("#board");
  board.innerHTML = "";

  for (const [key, meta] of Object.entries(STATUS_META)) {
    const items = tasks.filter((t) => t.status === key);
    const col = document.createElement("div");
    col.className = `column ${meta.cls}`;
    col.innerHTML = `
      <div class="col-head">
        <span class="dot"></span>
        <h2>${meta.label}</h2>
        <span class="count">${items.length}</span>
      </div>
      <div class="col-body"></div>`;

    const body = col.querySelector(".col-body");
    if (!items.length) {
      body.innerHTML = `<p class="empty">Belum ada tugas</p>`;
    } else {
      items.forEach((t) => body.appendChild(cardEl(t)));
    }
    board.appendChild(col);
  }
}

/* ---------- modal detail ---------- */
function openModal(t) {
  const cl = t.checklist || [];
  const overdue = isOverdue(t);

  $("#modal").innerHTML = `
    <button class="close" id="modal-close" aria-label="Tutup">${ICON_X}</button>
    <span class="status-pill ${t.status}">${STATUS_META[t.status]?.label || t.status}</span>
    <h3>${esc(t.title)}</h3>

    <div class="kv">
      <div><div class="k">ID</div><div class="v">${esc(t.id || "—")}</div></div>
      <div><div class="k">Divisi</div><div class="v">${esc(t.division || "—")}</div></div>
      <div><div class="k">PIC</div><div class="v">${esc(t.pic || "—")}</div></div>
      <div><div class="k">Deadline</div><div class="v ${overdue ? "overdue" : ""}">${fmtDate(t.deadline)}${overdue ? " · telat" : ""}</div></div>
      <div><div class="k">Prioritas</div><div class="v">${esc(t.priority || "—")}</div></div>
      <div><div class="k">Checklist</div><div class="v">${cl.filter((c) => c.done).length}/${cl.length}</div></div>
    </div>

    ${
      t.description
        ? `<div class="section"><h4>Deskripsi</h4><p>${esc(t.description)}</p></div>`
        : ""
    }

    ${
      cl.length
        ? `<div class="section"><h4>Checklist</h4>
             <ul class="checklist">
               ${cl
                 .map(
                   (c) =>
                     `<li class="${c.done ? "ok" : ""}"><span class="box">${c.done ? ICON_CHECK : ""}</span>${esc(c.item)}</li>`
                 )
                 .join("")}
             </ul>
           </div>`
        : ""
    }

    ${t.notes ? `<div class="section"><h4>Catatan</h4><p>${esc(t.notes)}</p></div>` : ""}`;

  $("#modal-overlay").classList.remove("hidden");
  $("#modal-close").addEventListener("click", closeModal);
}

function closeModal() {
  $("#modal-overlay").classList.add("hidden");
}

/* ---------- rekap kehadiran ---------- */
function attendanceSummary() {
  if (!attendance || !attendance.members?.length) return { avg: 0, dates: [] };

  const dates = [...new Set(attendance.members.flatMap((m) => Object.keys(m.records || {})))].sort();
  const rows = attendance.members.map((m) => {
    const rec = m.records || {};
    const counts = { hadir: 0, izin: 0, sakit: 0, alfa: 0 };
    dates.forEach((d) => {
      const s = rec[d] || "alfa"; // tanggal ada tapi tak dicatat = alfa
      counts[s] = (counts[s] || 0) + 1;
    });
    const pct = dates.length ? Math.round((counts.hadir / dates.length) * 100) : 0;
    return { ...m, counts, pct };
  });

  const avg = rows.length ? Math.round(rows.reduce((a, r) => a + r.pct, 0) / rows.length) : 0;
  return { dates, rows, avg };
}

function renderAttendance() {
  const { dates, rows, avg } = attendanceSummary();
  const host = $("#attendance");

  if (!rows?.length) {
    host.innerHTML = `<p class="sub">Belum ada data kehadiran di <code>data/attendance.json</code>.</p>`;
    return;
  }

  const total = { hadir: 0, izin: 0, sakit: 0, alfa: 0 };
  rows.forEach((r) => Object.keys(total).forEach((k) => (total[k] += r.counts[k])));

  host.innerHTML = `
    <h2>Rekap Kehadiran — ${esc(attendance.period || "")}</h2>
    <p class="sub">${dates.length} sesi rapat: ${dates.map(fmtDate).join(" · ")} · anggota tanpa catatan dihitung alfa</p>
    <table>
      <thead>
        <tr>
          <th>Anggota</th><th>Divisi</th><th>Hadir</th><th>Izin</th>
          <th>Sakit</th><th>Alfa</th><th>% Kehadiran</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (r) => `
          <tr>
            <td>${esc(r.name)}</td>
            <td class="muted">${esc(r.division)}</td>
            <td>${r.counts.hadir}</td>
            <td>${r.counts.izin}</td>
            <td>${r.counts.sakit}</td>
            <td>${r.counts.alfa}</td>
            <td>
              <div class="pct">
                <div class="track"><span style="width:${r.pct}%"></span></div>
                <b>${r.pct}%</b>
              </div>
            </td>
          </tr>`
          )
          .join("")}
      </tbody>
      <tfoot>
        <tr>
          <td>Total</td><td></td>
          <td>${total.hadir}</td><td>${total.izin}</td>
          <td>${total.sakit}</td><td>${total.alfa}</td>
          <td><div class="pct"><div class="track"><span style="width:${avg}%"></span></div><b>${avg}%</b></div></td>
        </tr>
      </tfoot>
    </table>`;
}

/* ---------- rundown hari-H ---------- */
function renderRundown() {
  const host = $("#rundown");
  if (!host) return;

  if (!rundownItems.length) {
    host.innerHTML = `<p class="sub">Belum ada rundown di <code>data/rundown.json</code>.</p>`;
    return;
  }

  const jam = rundownItems.map((i) => i.waktu || "").filter(Boolean);
  const awal = (jam[0] || "").split(" - ")[0] || "";
  const akhir = (jam[jam.length - 1] || "").split(" - ").pop() || "";

  host.innerHTML = `
    <h2>Rundown — ${esc(attendance?.event || "Tanabata To Algorithm")}</h2>
    <p class="sub">${rundownItems.length} segmen · ${esc(awal)} – ${esc(akhir)} · PIC kosong berarti Koor Acara yang pegang</p>
    <table>
      <thead>
        <tr>
          <th>No</th><th>Waktu</th><th>Durasi</th><th>Kegiatan</th>
          <th>Keterangan</th><th>PIC</th><th>Tempat</th>
        </tr>
      </thead>
      <tbody>
        ${rundownItems
          .map(
            (i) => `
          <tr>
            <td>${i.no}</td>
            <td class="muted">${esc(i.waktu || "—")}</td>
            <td>${i.durasi ? `${i.durasi}′` : "—"}</td>
            <td>${esc(i.kegiatan || "—")}</td>
            <td class="muted">${esc(i.keterangan || "—")}</td>
            <td>${esc(i.pic || "—")}</td>
            <td class="muted">${esc(i.tempat || "—")}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;
}

/* ---------- jadwal rapat + countdown ---------- */
function fmtDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "—";
  const hari = d.toLocaleDateString("id-ID", { weekday: "long" });
  const tgl = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":");
  return `${hari}, ${tgl} · ${jam}`;
}

function splitRemaining(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

const pad = (n) => String(n).padStart(2, "0");

function renderMeetings() {
  const host = $("#meetings");
  const list = [...meetings].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  if (!list.length) {
    host.innerHTML = "";
    return;
  }

  host.innerHTML =
    `<div class="meet-head"><img class="ico-star" src="assets/decor-star.png" alt="" aria-hidden="true" />Jadwal Rapat</div>` +
    list
      .map((m) => {
        const rem = new Date(m.datetime).getTime() - Date.now();
        const past = rem < 0;
        const urgent = !past && rem <= DAY_MS;
        return `
        <article class="meet-card${past ? " past" : urgent ? " urgent" : ""}" data-rem="${esc(m.datetime)}">
          <div class="m-title">${esc(m.title)}</div>
          <div class="m-meta">
            <span class="pill-time${urgent ? " hot" : ""}">${ICON.calendar}${fmtDateTime(m.datetime)}</span>
            <span>${ICON.pin}${esc(m.place || "—")}</span>
          </div>
          <div class="countdown">
            <strong data-countdown>—</strong>
            <span data-label>menuju rapat</span>
          </div>
        </article>`;
      })
      .join("");

  tickCountdowns();
}

function tickCountdowns() {
  document.querySelectorAll(".meet-card").forEach((card) => {
    const target = new Date(card.dataset.rem).getTime();
    const rem = target - Date.now();
    const strong = card.querySelector("[data-countdown]");
    const label = card.querySelector("[data-label]");
    const pill = card.querySelector(".pill-time");
    if (!strong) return;

    if (Number.isNaN(target)) {
      strong.textContent = "—";
      label.textContent = "jadwal belum valid";
      return;
    }

    if (rem < 0) {
      card.classList.add("past");
      card.classList.remove("urgent");
      strong.textContent = "Selesai";
      label.textContent = "waktu sudah lewat";
      if (pill) pill.classList.remove("hot");
      return;
    }

    card.classList.remove("past");
    const p = splitRemaining(rem);
    strong.textContent =
      p.d > 0 ? `${p.d} hari ${pad(p.h)}:${pad(p.m)}:${pad(p.s)}` : `${pad(p.h)}:${pad(p.m)}:${pad(p.s)}`;
    label.textContent = p.d > 0 ? "lagi menuju rapat" : "tinggal hari ini";

    const urgent = rem <= DAY_MS;
    card.classList.toggle("urgent", urgent);
    if (pill) pill.classList.toggle("hot", urgent);
  });

  tickReminderCountdown();
}

/* ---------- popup reminder (muncul tiap dibuka kalau ≤ 1 hari lagi) ---------- */
let reminderMeeting = null;

function checkReminder() {
  const now = Date.now();
  const soon = meetings
    .map((m) => ({ ...m, ms: new Date(m.datetime).getTime() - now }))
    .filter((x) => !Number.isNaN(x.ms) && x.ms >= 0 && x.ms <= DAY_MS)
    .sort((a, b) => a.ms - b.ms);

  if (!soon.length) {
    reminderMeeting = null;
    return;
  }

  reminderMeeting = soon[0];
  const m = reminderMeeting;
  const p = splitRemaining(m.ms);
  const hot = m.ms <= DAY_MS;

  $("#reminder").innerHTML = `
    <span class="r-badge">${ICON.alarm}Pengingat Rapat</span>
    <h3>${esc(m.title)}</h3>
    <div class="r-count" id="r-count">
      <div class="r-unit${hot ? " hot" : ""}"><b data-unit="d">${p.d}</b><i>hari</i></div>
      <div class="r-unit${hot ? " hot" : ""}"><b data-unit="h">${pad(p.h)}</b><i>jam</i></div>
      <div class="r-unit${hot ? " hot" : ""}"><b data-unit="m">${pad(p.m)}</b><i>menit</i></div>
      <div class="r-unit${hot ? " hot" : ""}"><b data-unit="s">${pad(p.s)}</b><i>detik</i></div>
    </div>
    <p class="r-info">${ICON.calendar}${fmtDateTime(m.datetime)} <span class="r-dot">·</span> ${ICON.pin}${esc(m.place || "—")}</p>
    ${m.note ? `<div class="section"><h4>Catatan</h4><p>${esc(m.note)}</p></div>` : ""}
    <button class="btn-primary" id="reminder-close">Siap, mengerti!</button>`;

  $("#reminder-overlay").classList.remove("hidden");
  $("#reminder-close").addEventListener("click", closeReminder);
}

function tickReminderCountdown() {
  const host = $("#r-count");
  if (!host || !reminderMeeting || $("#reminder-overlay").classList.contains("hidden")) return;

  const rem = new Date(reminderMeeting.datetime).getTime() - Date.now();
  if (rem < 0) {
    closeReminder();
    return;
  }
  const p = splitRemaining(rem);
  const set = (unit, val) => {
    const el = host.querySelector(`[data-unit="${unit}"]`);
    if (el) el.textContent = unit === "d" ? val : pad(val);
  };
  set("d", p.d);
  set("h", p.h);
  set("m", p.m);
  set("s", p.s);
}

function closeReminder() {
  $("#reminder-overlay").classList.add("hidden");
  reminderMeeting = null;
}

/* ---------- tabs ---------- */
function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabs.forEach((b) => b.classList.toggle("active", b === btn));
      document
        .querySelectorAll(".view")
        .forEach((v) => v.classList.toggle("hidden", v.id !== `view-${btn.dataset.tab}`));
    });
  });

  $("#modal-overlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closeReminder();
    }
  });
  $("#reminder-overlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeReminder();
  });
}

/* ---------- boot ---------- */
/* =========================================================
   SCENE PIXEL ART — RUANG KERJA
   ========================================================= */
function renderOffice() {
  const host = $("#office-scene");
  if (!host || !team.length) return;
  const attMap = {};
  (attendance?.members || []).forEach((m) => { attMap[m.name] = m; });
  host.innerHTML = team.map((p) => {
    const m = attMap[p.name];
    const last = m?.records?.[m.records.length - 1];
    let dot = "var(--green)";
    if (!p.koor && last) {
      dot = last.status === "alfa" ? "var(--red)"
        : last.status === "sakit" ? "var(--burst-1)"
        : last.status === "izin" ? "var(--yellow)" : "var(--green)";
    }
    return `
      <button class="ws${p.koor ? " koor" : ""}" data-name="${esc(p.name)}" data-slug="${esc(p.slug)}"
              style="left:${p.left}%;bottom:${p.bottom}%;width:${p.w}%;aspect-ratio:${p.sw} / ${p.sh};z-index:${p.koor ? 4 : p.bottom <= 15 ? 5 : 3}"
              aria-label="Jobdesk ${esc(p.name)}">
        <span class="ws-pill"><i style="background:${dot}"></i><span class="txt"><b>${esc(p.name)}</b><em>${esc(p.role || p.division)}</em></span></span>
        <img class="frame f-a" src="assets/pixel/ws-${p.slug}-a.png" alt="" />
        <img class="frame f-b" src="assets/pixel/ws-${p.slug}-b.png" alt="" />
      </button>` +
      (p.koor
        ? ""
        : `
      <div class="walker" data-name="${esc(p.name)}" data-left="${p.left}" data-bottom="${p.bottom}"
           style="left:${p.left + p.w / 2 - 2}%;bottom:${p.bottom}%">
        <span class="w-bubble">${ICON.clipboard}Lapor!</span>
        <img class="w-a" src="assets/pixel/walk-${p.slug}-a.png" alt="" />
        <img class="w-b" src="assets/pixel/walk-${p.slug}-b.png" alt="" />
      </div>`);
  }).join("");
  host.querySelectorAll(".ws").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = team.find((t) => t.name === btn.dataset.name);
      if (p) openJobdesk(p);
    });
  });
  initReportWalk(host);
}

/* ---------- animasi: anggota jalan ke meja koor buat lapor ----------
   Rutenya digambar logis, murni sumbu X/Y (gak diagonal):
   1. baris belakang: geser ke celah bebas antar meja di depth barisnya sendiri
   2. turun lurus lewat celah itu sampai koridor depan (y kecil = depan kamera)
   3. jalan di koridor depan — sejajar garis lantai, di depan semua meja baris
      depan, dan gak pernah lewat di atas meja koor
   4. berhenti DI SAMPING meja koor (belum nyampe mejanya) + bubble "Lapor!"
   Trek balik = rute yang sama dibalik. */
function initReportWalk(host) {
  const walkers = [...host.querySelectorAll(".walker")];
  if (!walkers.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const W = 760;
  const H = 470;
  const pctX = (v) => (v * W) / 100; // % horizontal → px
  const pctY = (v) => (v * H) / 100; // % bottom    → px (0 = pinggir bawah)
  const MARGIN = 3; // jarak minimal sprite ↔ meja lain
  const CORRIDOR = 4; // koridor depan (px dari pinggir bawah)
  const SPEED = 95; // px/detik

  const koor = team.find((t) => t.koor);
  const frontRow = (p) => team.filter((t) => t !== p && !t.koor && t.bottom <= 15);
  const backRow = (p) => team.filter((t) => t !== p && !t.koor && t.bottom > 15);

  /* interval x yang harus dihindari (pakai koordinat px) */
  const boxes = (list) => list.map((t) => [pctX(t.left), pctX(t.left + t.w)]);
  const PLANTS = [
    [10, 46],
    [706, 742],
  ];
  const KOOR_BOX = [pctX(koor.left), pctX(koor.left + koor.w)];

  /* Semua koordinat = TEPI KIRI sprite (style.left) & kaki (style.bottom),
     jadi sprite jalan nutupin [x, x+WALK] secara horizontal. */
  const WALK = 30.4; // 4% dari 760
  const overlapX = (x, [a, b]) => x < b + MARGIN && x + WALK > a - MARGIN;
  const anyBlocked = (x, blocked) => blocked.some((box) => overlapX(x, box));

  /* tepi-kiri x yang bebas dari semua blok; celah terdekat ke x */
  const freeX = (cx, blocked) => {
    const segs = blocked
      .map(([a, b]) => [Math.max(0, a - WALK - MARGIN), Math.min(W, b + MARGIN)])
      .sort((m, n) => m[0] - n[0]);
    const ivs = [];
    let cursor = 0;
    for (const [a, b] of segs) {
      if (a > cursor) ivs.push([cursor, a]);
      cursor = Math.max(cursor, b);
    }
    if (cursor < W - WALK) ivs.push([cursor, W - WALK]);
    let best = cx;
    let dist = Infinity;
    for (const [a, b] of ivs) {
      const c = Math.min(Math.max(cx, a), b);
      if (Math.abs(c - cx) < dist) {
        dist = Math.abs(c - cx);
        best = c;
      }
    }
    return best;
  };

  const buildRoute = (p) => {
    const homeX = pctX(p.left + p.w / 2) - WALK / 2; // jajar sama tengah meja
    const y0 = pctY(p.bottom);
    const back = p.bottom > 15;

    // turun lurus bebas dari meja baris depan + koor + pot.
    // meja baris belakang cuma ngeblok kalo ini orang baris belakang
    // (orang baris depan gak pernah nyampe depth segitu — aman)
    const dropBlocked = [
      ...boxes(frontRow(p)),
      ...(back ? boxes(backRow(p)) : []),
      KOOR_BOX,
      ...PLANTS,
    ];
    // baris belakang: geser mendatar di depth barisnya sendiri bebas dari
    // meja baris belakang lain (meja sendiri boleh — berdiri depan kursi)
    const sideBlocked = boxes(backRow(p));
    const dropX = back
      ? freeX(homeX, [...dropBlocked, ...sideBlocked])
      : anyBlocked(homeX, dropBlocked)
        ? freeX(homeX, dropBlocked)
        : homeX;

    // titik lapor: di samping kiri/kanan meja koor, BELUM nyentuh mejanya
    const spot = dropX < 380 ? 246 : 476; // celah ±31px dari tepi meja koor

    const legs = [{ x: homeX, y: y0 }];
    if (Math.abs(dropX - homeX) > 3) legs.push({ x: dropX, y: y0 });
    legs.push({ x: dropX, y: CORRIDOR });
    legs.push({ x: spot, y: CORRIDOR });
    return legs;
  };

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const moveLegs = async (w, legs) => {
    for (let i = 1; i < legs.length; i++) {
      const a = legs[i - 1];
      const b = legs[i];
      const d = Math.min(3.4, Math.max(0.35, Math.hypot(b.x - a.x, b.y - a.y) / SPEED));
      w.style.setProperty("--walk", `${d}s`);
      w.style.left = `${(b.x / W) * 100}%`;
      w.style.bottom = `${(b.y / H) * 100}%`;
      await wait(d * 1000 + 220); // jeda 220ms di tiap belokan biar baca sebagai "berhenti terus nyambung"
    }
  };

  /* ganti sprite meja: orang pergi → meja kosong; orang balik → orang duduk lagi */
  const setDesk = (w, away) => {
    const btn = [...host.querySelectorAll(".ws")].find((b) => b.dataset.name === w.dataset.name);
    if (!btn) return;
    const sfx = away ? "-desk" : "";
    btn.querySelector(".f-a").src = `assets/pixel/ws-${btn.dataset.slug}${sfx}-a.png`;
    btn.querySelector(".f-b").src = `assets/pixel/ws-${btn.dataset.slug}${sfx}-b.png`;
    btn.classList.toggle("away", away);
  };

  let i = 0;
  async function cycle() {
    const w = walkers[i % walkers.length];
    i += 1;
    const p = team.find((t) => t.name === w.dataset.name);
    if (!p) return cycle();
    const legs = buildRoute(p);

    // snap ke titik awal rute dulu (masih transparan) biar langkah pertama
    // gak nyambung diagonal dari posisi inline awal renderer
    w.style.setProperty("--walk", "0s");
    w.style.left = `${(legs[0].x / W) * 100}%`;
    w.style.bottom = `${(legs[0].y / H) * 100}%`;
    void w.offsetWidth; // paksa reflow biar snap-nya kejadian sebelum transisi

    setDesk(w, true); // kursinya kosong, orangnya berangkat
    w.classList.add("on");
    await wait(140);
    await moveLegs(w, legs);

    w.classList.add("report"); // berdiri di samping meja koor + bubble "Lapor!"
    await wait(2800);
    w.classList.remove("report");

    await moveLegs(w, [...legs].reverse()); // trek balik = rute dibalik
    w.classList.remove("on");
    setDesk(w, false); // balik ke meja, duduk lagi
    await wait(1200);
    cycle();
  }

  setTimeout(cycle, 2000);
}

function openJobdesk(p) {
  const mine = tasks.filter((t) => t.pic === p.name);
  const done = mine.filter((t) => t.status === "done").length;
  const modal = $("#modal");
  modal.innerHTML = `
    <button class="close" id="modal-close" aria-label="Tutup">${ICON_X}</button>
    <span class="status-pill ${p.koor ? "in_progress" : "todo"}">${p.koor ? "Koordinator" : esc(p.division)}</span>
    <h3>${esc(p.name)}</h3>
    <div class="kv">
      <div><div class="k">Role</div><div class="v">${esc(p.role)}</div></div>
      <div><div class="k">Divisi</div><div class="v">${esc(p.division || "—")}</div></div>
      <div><div class="k">Tugas</div><div class="v">${mine.length ? `${done}/${mine.length} selesai` : `${(p.jobdesk || []).length} poin jobdesk`}</div></div>
    </div>
    <div class="section">
      <h4>Jobdesk</h4>
      <ul class="checklist">
        ${(p.jobdesk || []).map((j) => `<li><span class="box"></span>${esc(j)}</li>`).join("")}
      </ul>
    </div>
    ${mine.length ? `
    <div class="section">
      <h4>Tugas aktif</h4>
      ${mine.map((t) => `
        <p class="mini-task"><span class="status-pill ${t.status}">${esc(STATUS_META[t.status]?.label || t.status)}</span> ${esc(t.title)}</p>`).join("")}
    </div>` : ""}
  `;
  $("#modal-overlay").classList.remove("hidden");
  $("#modal-close").addEventListener("click", closeModal);
}

async function boot() {
  try {
    const [tRes, aRes, mRes, rRes, runRes] = await Promise.all([
      fetch("data/tasks.json"),
      fetch("data/attendance.json"),
      fetch("data/meetings.json"),
      fetch("data/team.json"),
      fetch("data/rundown.json"),
    ]);
    if (!tRes.ok) throw new Error("tasks.json tidak bisa dimuat");
    const tasksDoc = await tRes.json();
    tasks = tasksDoc.tasks || [];
    attendance = aRes.ok ? await aRes.json() : null;
    meetings = mRes.ok ? ((await mRes.json()).meetings || []) : [];
    team = rRes.ok ? ((await rRes.json()).people || []) : [];
    rundownItems = runRes.ok ? ((await runRes.json()).items || []) : [];

    const eventName = tasksDoc.event || "Papan Kinerja Panitia";
    $("#event-name").textContent = eventName;
    document.title = `${eventName} · Papan Kinerja`;
    $("#event-period").textContent = tasksDoc.period || attendance?.period || "";

    renderStats();
    renderBoard();
    renderAttendance();
    renderRundown();
    renderMeetings();
    renderOffice();
    initTabs();
    checkReminder();
    setInterval(tickCountdowns, 1000);
    $("#loading").classList.add("hidden");
  } catch (err) {
    $("#loading").innerHTML = `
      <div>
        <b>Gagal memuat data.</b><br>${esc(err.message)}<br><br>
        Kalau dibuka lewat <code>file://</code>, fetch JSON memang diblokir browser.<br>
        Jalankan server lokal dulu: <code>python3 -m http.server 8000</code><br>
        lalu buka <code>http://localhost:8000</code>
      </div>`;
    console.error(err);
  }
}

boot();