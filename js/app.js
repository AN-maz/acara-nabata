/* Papan Kinerja Panitia — render kanban, modal detail, rekap kehadiran.
   Semua data dibaca dari file JSON (data/tasks.json & data/attendance.json). */

const STATUS_META = {
  todo: { label: "To Do", cls: "todo" },
  in_progress: { label: "In Progress", cls: "progress" },
  done: { label: "Done", cls: "done" },
};

const $ = (sel) => document.querySelector(sel);

let tasks = [];
let attendance = null;
let meetings = [];

const DAY_MS = 86400000; // 24 jam — ambang "tinggal 1 hari" buat popup

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
  const cards = [
    { label: "Total Tugas", value: total, bar: null },
    { label: "Selesai", value: `${pct}<small>%</small>`, bar: pct },
    { label: "Sedang Dikerjakan", value: doing, bar: null },
    { label: "Anggota Tim", value: attendance ? attendance.members.length : 0, bar: null },
    { label: "Kehadiran Rata-rata", value: `${att.avg}<small>%</small>`, bar: att.avg },
  ];

  $("#stats").innerHTML = cards
    .map(
      (c) => `
      <div class="stat">
        <div class="label">${c.label}</div>
        <div class="value">${c.value}</div>
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
      ${overdue ? '<span class="badge overdue">Terlambat</span>' : `<span>⏱ ${fmtDate(t.deadline)}</span>`}
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
      body.innerHTML = `<p class="empty">Belum ada tugas 🎉</p>`;
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
    <button class="close" id="modal-close" aria-label="Tutup">✕</button>
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
                     `<li class="${c.done ? "ok" : ""}"><span class="box">${c.done ? "✓" : ""}</span>${esc(c.item)}</li>`
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
    `<div class="meet-head">⏰ Jadwal Rapat</div>` +
    list
      .map((m) => {
        const rem = new Date(m.datetime).getTime() - Date.now();
        const past = rem < 0;
        const urgent = !past && rem <= DAY_MS;
        return `
        <article class="meet-card${past ? " past" : urgent ? " urgent" : ""}" data-rem="${esc(m.datetime)}">
          <div class="m-title">${esc(m.title)}</div>
          <div class="m-meta">
            <span class="pill-time${urgent ? " hot" : ""}">📅 ${fmtDateTime(m.datetime)}</span>
            <span>📍 ${esc(m.place || "—")}</span>
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
    <span class="r-badge">⏰ Pengingat Rapat</span>
    <h3>${esc(m.title)}</h3>
    <div class="r-count" id="r-count">
      <div class="r-unit${hot ? " hot" : ""}"><b data-unit="d">${p.d}</b><i>hari</i></div>
      <div class="r-unit${hot ? " hot" : ""}"><b data-unit="h">${pad(p.h)}</b><i>jam</i></div>
      <div class="r-unit${hot ? " hot" : ""}"><b data-unit="m">${pad(p.m)}</b><i>menit</i></div>
      <div class="r-unit${hot ? " hot" : ""}"><b data-unit="s">${pad(p.s)}</b><i>detik</i></div>
    </div>
    <p class="r-info">📅 ${fmtDateTime(m.datetime)} · 📍 ${esc(m.place || "—")}</p>
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
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const isBoard = btn.dataset.tab === "board";
      $("#view-board").classList.toggle("hidden", !isBoard);
      $("#view-attendance").classList.toggle("hidden", isBoard);
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
async function boot() {
  try {
    const [tRes, aRes, mRes] = await Promise.all([
      fetch("data/tasks.json"),
      fetch("data/attendance.json"),
      fetch("data/meetings.json"),
    ]);
    if (!tRes.ok) throw new Error("tasks.json tidak bisa dimuat");
    const tasksDoc = await tRes.json();
    tasks = tasksDoc.tasks || [];
    attendance = aRes.ok ? await aRes.json() : null;
    meetings = mRes.ok ? ((await mRes.json()).meetings || []) : [];

    const eventName = tasksDoc.event || "Papan Kinerja Panitia";
    $("#event-name").textContent = eventName;
    document.title = `${eventName} · Papan Kinerja`;
    $("#event-period").textContent = tasksDoc.period || attendance?.period || "";

    renderStats();
    renderBoard();
    renderAttendance();
    renderMeetings();
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