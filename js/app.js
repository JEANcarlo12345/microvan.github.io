const catalog = window.MICROVAN_CATALOG || [];
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const state = {
  album: 0,
  track: 0,
  isPlaying: false,
  repeat: false,
  shuffled: false
};

const audio = $("#audio");
const albumRail = $("#albumRail");
const albumView = $("#albumView");
const trackList = $("#trackList");
const search = $("#songSearch");
const toast = $("#toast");
const player = $("#player");
const pCover = $("#playerCover");
const pTitle = $("#playerTitle");
const pAlbum = $("#playerAlbum");
const playBtn = $("#playBtn");
const progress = $("#progress");
const volume = $("#volume");
const currentTime = $("#currentTime");
const totalTime = $("#totalTime");
const lyricsModal = $("#lyricsModal");
const lyricsTitle = $("#lyricsTitle");
const lyricsText = $("#lyricsText");
const creditsText = $("#creditsText");

function escapeHTML(v=""){
  return String(v).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[m]);
}

function formatTime(sec){
  if(!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec/60), s = Math.floor(sec%60).toString().padStart(2,"0");
  return `${m}:${s}`;
}

function showToast(message){
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.t);
  showToast.t = setTimeout(()=>toast.classList.remove("show"), 2800);
}

function renderAlbums(){
  albumRail.innerHTML = catalog.map((a,i)=>`
    <button class="album-card ${i===state.album?'active':''}" data-album="${i}">
      <img src="${escapeHTML(a.cover)}" alt="Portada ${escapeHTML(a.title)}">
      <div class="album-card-copy">
        <span>${escapeHTML(a.type)} · ${escapeHTML(a.year)}</span>
        <strong>${escapeHTML(a.title)}</strong>
        <small>${a.tracks.length} ${a.tracks.length===1?'tema':'temas'}</small>
      </div>
    </button>
  `).join("");
  $$(".album-card", albumRail).forEach(btn=>{
    btn.addEventListener("click", ()=>{
      state.album = +btn.dataset.album;
      state.track = 0;
      renderAlbums();
      renderAlbum();
    });
  });
}

function renderAlbum(filter=""){
  const a = catalog[state.album];
  if(!a) return;
  albumView.innerHTML = `
    <div class="album-hero-art"><img src="${escapeHTML(a.cover)}" alt="${escapeHTML(a.title)}"></div>
    <div class="album-hero-copy">
      <div class="eyebrow">${escapeHTML(a.type)} · ${escapeHTML(a.year)}</div>
      <h3>${escapeHTML(a.title)}</h3>
      <p>${escapeHTML(a.description)}</p>
      <button class="solid-btn" id="albumPlay">▶ Reproducir</button>
    </div>
  `;
  $("#albumPlay").addEventListener("click", ()=> playTrack(state.album,0));

  const q = filter.trim().toLowerCase();
  const rows = a.tracks
    .map((t,i)=>({t,i}))
    .filter(({t})=>!q || t.title.toLowerCase().includes(q));

  trackList.innerHTML = rows.length ? rows.map(({t,i})=>`
    <div class="track-row ${state.album===state.album && state.track===i && state.isPlaying?'playing':''}">
      <button class="track-play" data-track="${i}" aria-label="Reproducir ${escapeHTML(t.title)}">▶</button>
      <div class="track-index">${String(i+1).padStart(2,"0")}</div>
      <div class="track-main">
        <strong>${escapeHTML(t.title)}</strong>
        <span>Microvan · ${escapeHTML(a.title)}</span>
      </div>
      <div class="track-duration">${escapeHTML(t.duration || "—")}</div>
      <button class="text-btn lyrics-btn" data-track="${i}">Letra</button>
      <button class="text-btn credits-btn" data-track="${i}">Créditos</button>
    </div>
  `).join("") : `<div class="empty">No hay canciones que coincidan con la búsqueda.</div>`;

  $$(".track-play", trackList).forEach(b=>b.addEventListener("click",()=>playTrack(state.album,+b.dataset.track)));
  $$(".lyrics-btn", trackList).forEach(b=>b.addEventListener("click",()=>openInfo(+b.dataset.track,"lyrics")));
  $$(".credits-btn", trackList).forEach(b=>b.addEventListener("click",()=>openInfo(+b.dataset.track,"credits")));
}

function openInfo(trackIndex, kind){
  const a = catalog[state.album], t = a.tracks[trackIndex];
  lyricsTitle.textContent = kind==="lyrics" ? t.title : `Créditos · ${t.title}`;
  lyricsText.textContent = kind==="lyrics" ? (t.lyrics || "Letra por publicar.") : (t.credits || "Créditos por publicar.");
  creditsText.textContent = kind==="lyrics" ? (t.credits || "") : "";
  lyricsModal.classList.add("open");
  document.body.classList.add("modal-open");
}

function playTrack(albumIndex, trackIndex){
  const a = catalog[albumIndex], t = a?.tracks?.[trackIndex];
  if(!t) return;
  state.album = albumIndex;
  state.track = trackIndex;
  pCover.src = a.cover;
  pTitle.textContent = t.title;
  pAlbum.textContent = `${a.title} · Microvan`;
  player.classList.add("visible");

  if(audio.src.endsWith(encodeURI(t.src)) && !audio.paused){
    audio.pause();
    return;
  }
  audio.src = t.src;
  audio.play().then(()=>{
    state.isPlaying = true;
    playBtn.textContent = "❚❚";
    renderAlbum(search.value);
  }).catch(()=>{
    state.isPlaying = false;
    playBtn.textContent = "▶";
    showToast("El archivo de audio aún no está cargado en /music.");
  });
}

function nextTrack(){
  const a = catalog[state.album];
  if(!a?.tracks?.length) return;
  let next = state.track + 1;
  if(state.shuffled && a.tracks.length > 1){
    do { next = Math.floor(Math.random()*a.tracks.length); } while(next===state.track);
  }
  if(next >= a.tracks.length) next = 0;
  playTrack(state.album,next);
}
function prevTrack(){
  const a = catalog[state.album];
  if(!a?.tracks?.length) return;
  let prev = state.track - 1;
  if(prev < 0) prev = a.tracks.length - 1;
  playTrack(state.album,prev);
}

audio.addEventListener("play",()=>{state.isPlaying=true;playBtn.textContent="❚❚";renderAlbum(search.value)});
audio.addEventListener("pause",()=>{state.isPlaying=false;playBtn.textContent="▶";renderAlbum(search.value)});
audio.addEventListener("loadedmetadata",()=>{totalTime.textContent=formatTime(audio.duration)});
audio.addEventListener("timeupdate",()=>{
  currentTime.textContent = formatTime(audio.currentTime);
  progress.value = audio.duration ? (audio.currentTime/audio.duration)*100 : 0;
});
audio.addEventListener("ended",()=> state.repeat ? (audio.currentTime=0,audio.play()) : nextTrack());
audio.addEventListener("error",()=>{
  if(audio.getAttribute("src")) showToast("Agrega el MP3 indicado en el catálogo para habilitar esta canción.");
});

playBtn.addEventListener("click",()=>{
  if(!audio.src) return playTrack(state.album,state.track);
  audio.paused ? audio.play().catch(()=>showToast("Audio no disponible todavía.")) : audio.pause();
});
$("#nextBtn").addEventListener("click",nextTrack);
$("#prevBtn").addEventListener("click",prevTrack);
$("#shuffleBtn").addEventListener("click",e=>{
  state.shuffled=!state.shuffled; e.currentTarget.classList.toggle("on",state.shuffled);
});
$("#repeatBtn").addEventListener("click",e=>{
  state.repeat=!state.repeat; e.currentTarget.classList.toggle("on",state.repeat);
});
progress.addEventListener("input",()=>{if(audio.duration) audio.currentTime=(progress.value/100)*audio.duration});
volume.addEventListener("input",()=>audio.volume=volume.value);
search.addEventListener("input",()=>renderAlbum(search.value));

$("#closeModal").addEventListener("click",closeModal);
lyricsModal.addEventListener("click",e=>{if(e.target===lyricsModal) closeModal()});
function closeModal(){
  lyricsModal.classList.remove("open");
  document.body.classList.remove("modal-open");
}

const navToggle = $("#navToggle"), navLinks = $("#navLinks");
navToggle.addEventListener("click",()=>navLinks.classList.toggle("open"));
$$("a",navLinks).forEach(a=>a.addEventListener("click",()=>navLinks.classList.remove("open")));

const observer = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add("visible");observer.unobserve(e.target)}
  });
},{threshold:.12});
$$(".reveal").forEach(el=>observer.observe(el));

renderAlbums();
renderAlbum();


// ===== MERCH =====
const merch = window.MICROVAN_MERCH || [];
const merchGrid = document.querySelector("#merchGrid");
const merchFilters = document.querySelector("#merchFilters");

function renderMerch(category="Todos"){
  if(!merchGrid || !merchFilters) return;
  const categories = ["Todos", ...new Set(merch.map(p=>p.category))];
  merchFilters.innerHTML = categories.map(c=>`
    <button class="filter-btn ${c===category?'active':''}" data-category="${escapeHTML(c)}">${escapeHTML(c)}</button>
  `).join("");
  merchGrid.innerHTML = merch
    .filter(p=>category==="Todos" || p.category===category)
    .map(p=>`
      <article class="merch-card reveal visible">
        <div class="merch-image"><img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}"></div>
        <div class="merch-copy">
          <div class="label">${escapeHTML(p.category)}</div>
          <h3>${escapeHTML(p.name)}</h3>
          <p>${escapeHTML(p.price || "")}</p>
          <div class="merch-buy">
            <span class="merch-note">Venta externa</span>
            <a class="ml-btn" href="${escapeHTML(p.url)}" target="_blank" rel="noopener noreferrer">Ver en Mercado Libre ↗</a>
          </div>
        </div>
      </article>
    `).join("");
  document.querySelectorAll(".filter-btn", merchFilters).forEach(btn=>{
    btn.addEventListener("click",()=>renderMerch(btn.dataset.category));
  });
}
renderMerch();

// ===== PLAYER CLOSE / REOPEN =====
const playerClose = document.querySelector("#playerClose");
const playerReopen = document.querySelector("#playerReopen");

if(playerClose && playerReopen){
  playerClose.addEventListener("click", ()=>{
    audio.pause();
    player.classList.remove("visible");
    playerReopen.classList.add("show");
  });

  playerReopen.addEventListener("click", ()=>{
    playerReopen.classList.remove("show");
    player.classList.add("visible");
  });
}
