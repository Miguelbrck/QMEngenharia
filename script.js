/* ---------------- DATA ---------------- */
const buildings = [
  {
    id:"ipe", name:"Edifício Ipê", type:"Residencial · Apartamentos",
    loc:"Bairro Nossa Senhora de Fátima", year:"2006",
    desc:"O primeiro prédio vertical da QM: 24 apartamentos de 2 e 3 quartos, próximo à Praça de Fátima.",
    phone:"(34) 3821-0011"
  },
  {
    id:"jacaranda", name:"Condomínio Jacarandá", type:"Urbano · Condomínio fechado",
    loc:"Jardim Alexandre Campos", year:"2013",
    desc:"Condomínio horizontal com área verde central, quadra poliesportiva e portaria 24h.",
    phone:"(34) 3821-0022"
  },
  {
    id:"getulio", name:"Edifício Getúlio Business", type:"Comercial · Salas e lojas",
    loc:"Avenida Getúlio Vargas, Centro", year:"2016",
    desc:"Galeria comercial com 32 salas e térreo com lojas voltadas para a avenida principal.",
    phone:"(34) 3821-0033"
  },
  {
    id:"aeroporto", name:"Edifício Aeroporto Vista", type:"Residencial · Apartamentos",
    loc:"Bairro Aeroporto", year:"2019",
    desc:"Torre de 10 andares com energia solar e cisterna de reuso de água em todas as unidades.",
    phone:"(34) 3821-0044"
  },
  {
    id:"boavista", name:"Village Boa Vista", type:"Residencial · Casas",
    loc:"Bairro Boa Vista", year:"2022",
    desc:"Conjunto de 40 casas térreas e sobrados em condomínio fechado, com clube privativo.",
    phone:"(34) 3821-0055"
  },
  {
    id:"suica", name:"Edifício Nova Suíça Corporate", type:"Comercial · Escritórios",
    loc:"Bairro Nova Suíça", year:"2024",
    desc:"Edifício corporativo com salas modulares, auditório compartilhado e estacionamento próprio.",
    phone:"(34) 3821-0066"
  }
];



/* ===================================================
--------------------------IMAGENS----------------------
====================================================== */
/* FOTOS DO POPUP DO CARROSEL */
const PHOTOS = {
  ipe: ["images/ipe-1.jpg", "images/ipe-2.jpg", "images/ipe-3.jpg"]
};
PHOTOS.jacaranda = ["images/jacaranda.jpg"];
PHOTOS.getulio = ["images/getulio.jpg"];
PHOTOS.boavista = ["images/boavista.jpg"];
PHOTOS.aeroporto = ["images/aeroporto.jpg"];
PHOTOS.suica = ["images/suica.jpg"];
const IMAGES = {
  history: "images/historia.jpg",   // FOTO DA SEÇÃO HISTÓRIA
  ctaCity: "images/cta-cidade.jpg",   // FOTO QUE FICA EM BAIXO DO GRADIENT LARANJA
  solutions: { residencial:"images/solucao-residencial.jpg", comercial:"images/solucao-comercial.jpg", urbano:"images/solucao-urbano.jpg" },
  projects:  { ipe: PHOTOS.ipe[0], jacaranda:"images/jacaranda.jpg", getulio:"images/getulio.jpg", boavista:"images/boavista.jpg", aeroporto:"images/aeroporto.jpg", suica:"images/suica.jpg" }   // fotos dos cards de projetos
};
const bg = u => u ? `style="background-image:url('${u}')"` : '';

/* HISTÓRIA + CTA */
const historyMedia = document.getElementById('historyMedia');
if(IMAGES.history) historyMedia.innerHTML = `<img src="${IMAGES.history}" alt="Obra da QM Engenharia">`;
else { historyMedia.remove(); document.querySelector('.history-grid').classList.add('no-media'); }
if(IMAGES.ctaCity) document.getElementById('ctaBg').style.backgroundImage = `url("${IMAGES.ctaCity}")`;

/* SOLUÇÕES */
const ico = p => `<svg class="ico" viewBox="0 0 24 24">${p}</svg>`;
const SOLUTIONS = [
  {k:'residencial', t:'Residencial', d:'Apartamentos e espaços pessoais para acompanhar diferentes momentos da vida.', i:ico('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>')},
  {k:'comercial', t:'Comercial', d:'Ambientes planejados para negócios, serviços e novas oportunidades.', i:ico('<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-4h4v4"/>')},
  {k:'urbano', t:'Urbano', d:'Projetos que ajudam a transformar bairros e o crescimento da cidade.', i:ico('<path d="M3 21h18M5 21V9h5v12M10 21V4h5v17M15 21v-8h4v8"/>')}
];
document.getElementById('solGrid').innerHTML = SOLUTIONS.map(x=>`
  <div class="card"><div class="card-img" ${bg(IMAGES.solutions[x.k])}></div>
  <div class="card-body">${x.i}<h3>${x.t}</h3><p>${x.d}</p><button class="more" data-kind="${x.t}">Conheça →</button></div></div>`).join('');

/* PROJETOS */
const FEATURED = ['ipe','jacaranda','getulio'];
const grid = document.getElementById('buildingGrid');
FEATURED.map(id=>buildings.find(b=>b.id===id)).forEach(b=>{
  const card = document.createElement('div');
  card.className='card';
  card.innerHTML = `<div class="card-img" ${bg(IMAGES.projects[b.id])}></div>
    <div class="card-body"><span class="tag">${b.type.split('·')[0].trim()}</span>
    <h3>${b.name}</h3><div class="loc">${b.loc.replace(/^Bairro /,'')} • Patos de Minas • MG</div>
    <p>${b.desc}</p><button class="more" data-id="${b.id}">Ver detalhes →</button></div>`;
  card.querySelector('button').addEventListener('click', ()=>openBuilding(b.id));
  grid.appendChild(card);
});

/* CATÁLOGO */
const catOverlay = document.getElementById('catOverlay');
const catTrack = document.getElementById('catTrack');
const catView = document.getElementById('catView');
const catNext = document.getElementById('catNext');
let catBusy = false;
function openCatalog(kind){
  const list = buildings.filter(b=>b.type.startsWith(kind));
  if(!list.length){ document.getElementById('projetos').scrollIntoView({behavior:'smooth'}); return; }
  catTrack.innerHTML = '';
  list.forEach(b=>{
    const img = IMAGES.projects[b.id] || (PHOTOS[b.id] && PHOTOS[b.id][0]) || '';
    const c = document.createElement('div');
    c.className = 'card';
    c.innerHTML = `<div class="card-img" ${bg(img)}></div>
      <div class="card-body"><span class="tag">${b.type.split('·')[0].trim()}</span>
      <h3>${b.name}</h3><div class="loc">${b.loc.replace(/^Bairro /,'')} • Patos de Minas • MG</div>
      <p>${b.desc}</p><button class="more">Ver detalhes →</button></div>`;
    c.querySelector('button').addEventListener('click', ()=>{ closeCat(); openBuilding(b.id); });
    catTrack.appendChild(c);
  });
  catTrack.style.transition = 'none'; catTrack.style.transform = 'none'; catBusy = false;
  catView.classList.remove('shifted');
  catOverlay.classList.add('open');
  const step = catTrack.firstElementChild.getBoundingClientRect().width + 24;
  const fits = list.length * step - 24 <= catView.clientWidth + 1;
  catView.classList.toggle('fit', fits);
  catNext.style.display = fits ? 'none' : '';
}
function closeCat(){ catOverlay.classList.remove('open'); }
document.querySelectorAll('#solGrid button[data-kind]').forEach(btn=>btn.addEventListener('click', ()=>openCatalog(btn.dataset.kind)));
document.getElementById('catClose').addEventListener('click', closeCat);
/* CARROSEL INFINITO */
function catMove(dir){
  if(catBusy || catTrack.children.length < 2 || catNext.style.display==='none') return;
  catBusy = true; catView.classList.add('shifted');
  const st = catTrack.firstElementChild.getBoundingClientRect().width + 24;
  if(dir > 0){
    catTrack.style.transition = 'transform .45s ease'; catTrack.style.transform = `translateX(${-st}px)`;
    catTrack.addEventListener('transitionend', ()=>{
      catTrack.style.transition = 'none'; catTrack.appendChild(catTrack.firstElementChild);
      catTrack.style.transform = 'none'; catBusy = false;
    }, {once:true});
  } else {
    catTrack.style.transition = 'none'; catTrack.insertBefore(catTrack.lastElementChild, catTrack.firstElementChild);
    catTrack.style.transform = `translateX(${-st}px)`; catTrack.getBoundingClientRect();
    catTrack.style.transition = 'transform .45s ease'; catTrack.style.transform = 'none';
    catTrack.addEventListener('transitionend', ()=>{ catBusy = false; }, {once:true});
  }
}
catNext.addEventListener('click', ()=>catMove(1));
let touchX = null;
catView.addEventListener('touchstart', e=>{ touchX = e.touches[0].clientX; }, {passive:true});
catView.addEventListener('touchend', e=>{
  if(touchX===null) return;
  const dx = e.changedTouches[0].clientX - touchX; touchX = null;
  if(Math.abs(dx) > 40) catMove(dx < 0 ? 1 : -1);
});
catOverlay.addEventListener('click', e=>{ if(e.target===catOverlay) closeCat(); });

/* ---------------- MAPA INTERATIVO + EMPREENDIMENTOS ---------------- */
const mapPoints = document.getElementById('mapPoints');
const mapHint = document.getElementById('mapHint');
const mapWrap = document.getElementById('qmMapWrap');

/* --------------- CORDENADAS DOS EMPREENDIMENTOS ------------- */
const COORDS = {
  ipe:       [-18.5885, -46.5265],
  jacaranda: [-18.5660, -46.5075],
  getulio:   [-18.5792, -46.5170],
  aeroporto: [-18.6640, -46.4950],
  boavista:  [-18.5970, -46.5030],
  suica:     [-18.5735, -46.5330]
};
const MAP_ZOOM_TARGET = 17;
const MAP_ZOOM_OUT    = 11;

mapPoints.innerHTML = buildings.map((b, i) => {
  const c = COORDS[b.id];
  const mapsUrl = c
    ? `https://www.google.com/maps/search/?api=1&query=${c[0]},${c[1]}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.name}, ${b.loc}, Patos de Minas, MG, Brasil`)}`;
  return `
    <div class="map-point">
      <button class="map-point-select" type="button" data-id="${b.id}" aria-label="Ver ${b.name} no mapa">
        <span class="map-point-number">${i + 1}</span>
        <span class="map-point-copy"><strong>${b.name}</strong><small>${b.loc}</small></span>
        <span class="map-point-arrow" aria-hidden="true">›</span>
      </button>
      <a class="map-point-link" href="${mapsUrl}" target="_blank" rel="noopener noreferrer">Ver no Google Maps ↗</a>
    </div>`;
}).join('');

function setActivePoint(id){
  mapPoints.querySelectorAll('.map-point-select').forEach(p=>p.classList.toggle('active', p.dataset.id===id));
  Object.entries(markers).forEach(([k,m])=>{ const el=m.getElement(); if(el) el.classList.toggle('active', k===id); });
}

const markers = {};
let qmMap = null, flyToken = 0, currentFlyId = null;
const mapCard = document.getElementById('mapCard');

if(typeof L !== 'undefined'){
  const cityCenter = [-18.5880, -46.5080];
  qmMap = L.map('qmMap', {
    zoomControl:true, scrollWheelZoom:false, dragging:!L.Browser.mobile, tap:false,
    zoomSnap:0.25, minZoom:9, maxZoom:19, attributionControl:true
  });
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom:19, attribution:'Imagens © Esri, Maxar, Earthstar Geographics'
  }).addTo(qmMap);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    maxZoom:19, opacity:.9
  }).addTo(qmMap);

  const allPoints = buildings.map(b=>COORDS[b.id]).filter(Boolean);
  const fitOverview = (animate)=>{
    const bounds = L.latLngBounds(allPoints).pad(0.25);
    if(animate) qmMap.flyToBounds(bounds, {duration:2});
    else qmMap.fitBounds(bounds);
  };
  fitOverview(false);

  buildings.forEach((b,i)=>{
    const c = COORDS[b.id]; if(!c) return;
    const m = L.marker(c, {
      title:b.name, keyboard:true,
      icon:L.divIcon({className:'qm-pin', html:`<span>${i+1}</span>`, iconSize:[34,34], iconAnchor:[17,17]})
    }).addTo(qmMap);
    m.on('click', ()=>flyToBuilding(b.id));
    markers[b.id] = m;
  });

  document.getElementById('mapReset').addEventListener('click', ()=>{
    flyToken++; currentFlyId = null; hideMapCard(); setActivePoint(null);
    mapHint.textContent = 'Selecione um empreendimento acima';
    fitOverview(true);
  });
}

function hideMapCard(){ mapCard.classList.remove('show'); }
function showMapCard(b){
  document.getElementById('mcType').textContent = b.type.replace('·','•');
  document.getElementById('mcName').textContent = b.name;
  document.getElementById('mcLoc').textContent = b.loc + ' • Patos de Minas • MG';
  mapCard.classList.add('show');
}
document.getElementById('mcOpen').addEventListener('click', ()=>{ if(currentFlyId) openBuilding(currentFlyId); });

/* ANIMAÇÃO MAPA */
function safeFly(center, zoom, opts){
  let c = center;
  if(qmMap.getCenter().distanceTo(L.latLng(center)) < 2) c = [center[0]+0.00001, center[1]];
  qmMap.flyTo(c, zoom, opts);
}
function flyToBuilding(id){
  const b = buildings.find(x=>x.id===id);
  const c = COORDS[id];
  mapHint.textContent = `Empreendimento selecionado: ${b ? b.name : ''}`;
  if(!qmMap || !c){ setActivePoint(id); if(b) openBuilding(id); return; }

  const token = ++flyToken;
  currentFlyId = id;
  setActivePoint(id);
  hideMapCard();
  mapWrap.scrollIntoView({behavior:'smooth', block:'center'});

  const arrive = ()=>{
    if(token !== flyToken) return;
    mapWrap.classList.remove('flying');
    showMapCard(b);
  };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){ qmMap.setView(c, MAP_ZOOM_TARGET, {animate:false}); arrive(); return; }
  if(qmMap.getCenter().distanceTo(L.latLng(c)) < 5 && Math.abs(qmMap.getZoom()-MAP_ZOOM_TARGET) < 0.3){ arrive(); return; }

  document.getElementById('mapFlyText').textContent = 'Localizando · ' + b.name;
  mapWrap.classList.add('flying');

  const dive = ()=>{
    if(token !== flyToken) return;
    qmMap.once('moveend', arrive);
    safeFly(c, MAP_ZOOM_TARGET, {duration:2.6, easeLinearity:.2});
  };
  if(qmMap.getZoom() > MAP_ZOOM_OUT + 1.5){
    qmMap.once('moveend', dive);
    safeFly([-18.5880, -46.5080], MAP_ZOOM_OUT, {duration:1.3, easeLinearity:.2});
  } else dive();
}

mapPoints.querySelectorAll('.map-point-select').forEach(button => {
  button.addEventListener('click', () => flyToBuilding(button.dataset.id));
});

/* ---------------- PROJETO MODAL ---------------- */
const buildingOverlay = document.getElementById('buildingOverlay');
let currentBuilding = null;

function openBuilding(id){
  const b = buildings.find(x=>x.id===id);
  if(!b) return;
  currentBuilding = b;
  document.getElementById('mBadge').textContent = b.type.split('·')[0].trim();
  document.getElementById('mName').textContent = b.name;
  document.getElementById('mSub').textContent = b.loc.replace(/^Bairro /,'') + ' • Patos de Minas • MG';
  setupPhotos(b);
  document.getElementById('mDesc').textContent = b.desc;
  document.getElementById('mLoc').textContent = b.loc + ", Patos de Minas - MG";
  document.getElementById('mType').textContent = b.type.replace('·','•');
  document.getElementById('mYear').textContent = b.year;
  const phoneEl = document.getElementById('mPhone');
  phoneEl.textContent = b.phone;
  phoneEl.href = "tel:+55" + b.phone.replace(/\D/g,'');

  mapPoints.querySelectorAll('.map-point-select').forEach(p=>p.classList.toggle('active', p.getAttribute('data-id')===id));
  /* botão "Ver planta 3D": só aparece nos empreendimentos que têm planta cadastrada (planta-*.js) */
  document.getElementById('openPlan').hidden = !(window.QM_PLANS && window.QM_PLANS[id]);
  buildingOverlay.classList.add('open');
}
document.getElementById('openPlan').addEventListener('click', ()=>{
  if(currentBuilding && window.openPlan) window.openPlan(currentBuilding.id);
});
let photoIdx = 0;
function setupPhotos(b){
  const box = document.getElementById('mPhoto');
  const list = PHOTOS[b.id];
  photoIdx = 0;
  if(!list){ box.hidden = true; return; }
  box.hidden = false;
  document.getElementById('mImg').src = list[0];
  document.getElementById('mImg').alt = b.name;
}
document.getElementById('nextPhoto').addEventListener('click', ()=>{
  const list = currentBuilding && PHOTOS[currentBuilding.id];
  if(!list) return;
  photoIdx = (photoIdx + 1) % list.length;
  document.getElementById('mImg').src = list[photoIdx];
});
function closeBuilding(){ buildingOverlay.classList.remove('open'); }
document.getElementById('closeBuilding').addEventListener('click', closeBuilding);
document.getElementById('closeBuilding2').addEventListener('click', closeBuilding);
/* fecha somente pelo X (ou Esc) */

/* ---------------- AGENDA MODAL ---------------- */
const scheduleOverlay = document.getElementById('scheduleOverlay');
const scheduleBody = document.getElementById('scheduleBody');
const scheduleFormHTML = scheduleBody.innerHTML;
let selectedSlot = null;
let sending = false;

document.getElementById('openSchedule').addEventListener('click', ()=>{
  document.getElementById('sBuildingName').textContent = currentBuilding ? currentBuilding.name : '—';
  loadingOverlay.classList.remove('open');   // garante que nenhum carregamento antigo fique aberto
  scheduleBody.innerHTML = scheduleFormHTML;
  bindScheduleForm();
  const dateInput = document.getElementById('visitDate');
  const today = new Date();
  today.setDate(today.getDate()+1);
  dateInput.min = today.toISOString().split('T')[0];
  closeBuilding();
  scheduleOverlay.classList.add('open');
});

function maskPhone(el){
  let prev = 0;
  el.addEventListener('beforeinput', e=>{ if(e.data && /\D/.test(e.data)) e.preventDefault(); });
  el.addEventListener('input', e=>{
    let d = el.value.replace(/\D/g,'').slice(0,11);
    if(d.length>2 && d[2]!=='9') d = d.slice(0,10);
    if(e.inputType && e.inputType.startsWith('delete') && d.length===prev && d.length) d = d.slice(0,-1);
    prev = d.length;
    let v = d;
    if(d.length>2){
      const r = d.slice(2);
      v = '('+d.slice(0,2)+') ' + (r[0]==='9'
        ? r[0] + (r.length>1 ? ' '+r.slice(1,5) : '') + (r.length>5 ? '-'+r.slice(5) : '')
        : r.slice(0,4) + (r.length>4 ? '-'+r.slice(4) : ''));
    } else if(d.length){ v = '('+d; }
    el.value = v;
  });
}
function bindScheduleForm(){
  selectedSlot = null;
  maskPhone(document.getElementById('visitPhone'));
  const slots = document.querySelectorAll('.slot');
  slots.forEach(s=>{
    s.addEventListener('click', ()=>{
      slots.forEach(x=>x.classList.remove('selected'));
      s.classList.add('selected');
      selectedSlot = s.getAttribute('data-slot');
    });
  });
  document.getElementById('scheduleForm').addEventListener('submit', async e=>{
    e.preventDefault();
    if(sending) return;                     // evita envio duplo
    const date  = document.getElementById('visitDate').value;
    const name  = document.getElementById('visitName').value.trim();
    const email = document.getElementById('visitEmail').value.trim();
    const phone = document.getElementById('visitPhone').value.trim();

    if(!selectedSlot){ alert('Escolha um horário para a visita.'); return; }
    if(!date || !name){ return; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){ alert('Digite um e-mail válido.'); return; }
    if(phone && phone.replace(/\D/g,'').length < 10){ alert('Digite um telefone válido com DDD ou deixe o campo em branco.'); return; }
    const consent = document.getElementById('visitConsent');
    if(consent && !consent.checked){ alert('Autorize o envio da confirmação por e-mail para continuar.'); return; }

    const btn = e.target.querySelector('button[type="submit"]');
    const btnLabel = btn.textContent;
    btn.disabled = true; btn.textContent = 'Enviando...';
    sending = true;
    const ctrl = new AbortController();
    const timer = setTimeout(()=>ctrl.abort(), 20000);   // se o servidor travar, desiste em 20 s
    closeSchedule();                       // fecha o pop-up do formulário
    const logoAnim = runLogoLoading();     // abre o quadrado branco com a logo carregando
    try{
      // espera o envio E o fim da animação da logo
      const [res] = await Promise.all([
        fetch('/api/agendar', {
          method:'POST', signal: ctrl.signal,
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ name, email, phone, date, slot:selectedSlot, buildingId: currentBuilding.id, consent:true })
        }),
        logoAnim
      ]);
      const data = await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(data.error || 'Falha no envio');
    }catch(err){
      clearTimeout(timer); sending = false;
      loadingOverlay.classList.remove('open');
      scheduleOverlay.classList.add('open');   // volta para o formulário
      alert('Não foi possível enviar a confirmação agora. Tente novamente ou ligue para (34) 9 9884-0187.');
      btn.disabled = false; btn.textContent = btnLabel;
      return;
    }
    clearTimeout(timer); sending = false;
    loadingOverlay.classList.remove('open');
    const esc = t => String(t).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const dateFmt = new Date(date+'T00:00:00').toLocaleDateString('pt-BR', {day:'2-digit', month:'long', year:'numeric'});
    scheduleBody.innerHTML = `
      <div class="success">
        <div class="check">✓</div>
        <h4>Visita agendada!</h4>
        <p>Enviamos a confirmação para o e-mail <strong>${esc(email)}</strong>. Se não encontrar a mensagem, verifique a caixa de spam. Para remarcar, é só responder esse e-mail.</p>
        <div class="sum">
          ${esc(currentBuilding.name)}<br>
          ${dateFmt} — ${esc(selectedSlot)}<br>
          ${esc(name)}
        </div>
        <a href="#contato" class="pbtn pbtn-navy" id="contactBtn">Fale conosco</a>
        <button class="pbtn pbtn-out" id="doneBtn">Fechar</button>
      </div>
    `;
    document.getElementById('contactBtn').addEventListener('click', closeSchedule);
    document.getElementById('doneBtn').addEventListener('click', closeSchedule);
    scheduleOverlay.classList.add('open');   // mostra "Visita agendada!"
  });
}

/* ---------------- CARREGAMENTO DA LOGO (quadrado por quadrado) ---------------- */
const loadingOverlay = document.getElementById('loadingOverlay');
function runLogoLoading(){
  const squares = [...loadingOverlay.querySelectorAll('.load-logo rect')];
  const START = 300, STEP = 230, HOLD = 600;      // atraso inicial, intervalo entre quadrados, pausa no final (ms)
  squares.forEach(r=>r.classList.remove('on'));
  loadingOverlay.classList.add('open');
  return new Promise(resolve=>{
    squares.forEach((r,i)=>setTimeout(()=>r.classList.add('on'), START + i*STEP));
    setTimeout(resolve, START + squares.length*STEP + HOLD);
  });
}
function closeSchedule(){ scheduleOverlay.classList.remove('open'); }
document.getElementById('closeSchedule').addEventListener('click', closeSchedule);
/* fecha somente pelo X (ou Esc) */

document.addEventListener('keydown', e=>{
  if(e.key==='Escape'){ closeBuilding(); closeSchedule(); closeCat(); }
});

/* ---------------- CABEÇALHO SCROLL ---------------- */
const header = document.getElementById('siteHeader');
window.addEventListener('scroll', ()=>{
  header.classList.toggle('scrolled', window.scrollY > 40);
});

/* ---------------- MENU MOBILE (3 risquinhos) ---------------- */
const menuBtn = document.getElementById('menuToggle');
const siteNav = document.getElementById('siteNav');
function setMenu(open){
  header.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
}
menuBtn.addEventListener('click', ()=>setMenu(!header.classList.contains('menu-open')));
siteNav.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>setMenu(false)));
document.addEventListener('click', e=>{ if(!header.contains(e.target)) setMenu(false); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape') setMenu(false); });
window.addEventListener('resize', ()=>{ if(window.innerWidth > 760) setMenu(false); });


/* ---------------- SKYLINE DO HERO (camadas) ---------------- */
(function(){
  const svg = document.getElementById('heroSkyline');
  if(!svg) return;
  const W = 1000, GROUND = 580;
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const between = (a,b) => a + rand()*(b-a);

  // 2º gerador só para os detalhes laranja: assim o desenho dos prédios não muda
  let seed2 = 77;
  const rand2 = () => (seed2 = (seed2 * 16807) % 2147483647) / 2147483647;
  let seed3 = 303;                                         // 3º gerador: itens de engenharia (não mexe no desenho dos prédios)
  const rand3 = () => (seed3 = (seed3 * 16807) % 2147483647) / 2147483647;
  let curOp = 1;                                           // opacidade da camada atual
  const ORANGE = op => `rgba(196,100,58,${Math.min(1, op + .15).toFixed(2)})`;   // laranja da marca
  const AMBER  = op => `rgba(242,184,75,${(0.55 + 0.3*op).toFixed(2)})`;          // amarelo das janelas acesas

  /* SO_LARANJA_ENGENHARIA = true  -> só o guindaste e os itens de engenharia ficam laranja;
     portas, toldos, telhados e janelas voltam ao azul. Troque para false para ter os detalhes laranja de volta. */
  const SO_LARANJA_ENGENHARIA = true;
  const ACCENT = op => SO_LARANJA_ENGENHARIA ? `rgba(108,147,180,${Math.min(1, op).toFixed(2)})` : ORANGE(op);
  const LIT    = op => SO_LARANJA_ENGENHARIA ? `rgba(170,200,225,${(0.35 + 0.3*op).toFixed(2)})` : AMBER(op);

  /* DIAGONAL: a altura dos prédios sobe em linha reta da esquerda para a direita.
     X0 = onde começa | E0 = altura inicial | SLOPE = inclinação */
  const X0 = 110, E0 = 28, SLOPE = 0.45;
  const envelope = x => E0 + SLOPE * Math.max(0, x - X0);

  /* CASAS: chance de aparecer uma casa em cada posição.
     Na esquerda (bairro) quase tudo é casa; para a direita vão virando prédios,
     mas ainda sobram casas misturadas na frente dos prédios. */
  const houseChanceFront = x => Math.max(0.18, 0.92 - (x - X0) / 620);

  // da mais distante para a mais próxima
  // dy = profundidade | lift = quanto fica acima da camada da frente | start = onde a camada começa
  const layers = [
    { dy:75, lift:110, start:200, jit:12, wMin:34, wMax:60, gap:[1,5],  op:.22, fill:'#1B3251', win:false, house:()=>0,    trees:false },
    { dy:50, lift:75,  start:165, jit:12, wMin:40, wMax:70, gap:[2,7],  op:.38, fill:'#192F4B', win:true,  house:()=>0,    trees:false },
    { dy:25, lift:40,  start:135, jit:12, wMin:46, wMax:84, gap:[3,10], op:.62, fill:'#172B45', win:true,  house:x=>x<520?.30:.06, trees:false },
    { dy:0,  lift:0,   start:X0,  jit:14, wMin:52, wMax:96, gap:[4,14], op:1,   fill:'#16283D', win:true,  house:houseChanceFront, trees:true }
  ];

  // casa com telhado, chaminé, porta e janela
  function house(x, base, L, stroke, sw){
    const hh = between(38, 58), ww = between(44, 60), roof = between(16, 22);
    const t = base - hh, wall = t + roof;
    const at = `fill="none" stroke="${stroke}" stroke-width="${sw}"`;
    let o = `<path d="M${x},${base} V${wall} L${x+ww/2},${t} L${x+ww},${wall} V${base} Z" fill="${L.fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    if(rand() < .55){                                   // chaminé
      const cx = x + ww*0.72;
      o += `<path d="M${cx},${t+roof*0.6} V${t-5} h7 V${t+roof*0.85}" ${at}/>`;
    }
    o += `<line x1="${x}" y1="${wall}" x2="${x+ww}" y2="${wall}" ${at}/>`;               // beiral
    const oc = ACCENT(L.op);
    o += `<rect x="${x+ww*0.16}" y="${base-17}" width="9" height="17" fill="${oc}" stroke="${oc}" stroke-width="${sw}"/>`;   // porta laranja
    if(rand2() < .1) o += `<path d="M${x-2},${wall+1} L${x+ww/2},${t-1} L${x+ww+2},${wall+1}" fill="none" stroke="${oc}" stroke-width="${(sw*1.6).toFixed(2)}" stroke-linejoin="round"/>`;   // telhado laranja
    o += `<rect x="${x+ww*0.56}" y="${wall+8}" width="11" height="11" ${at}/>`;           // janela
    return { out:o, w:ww };
  }

  // árvore simples
  function tree(x, base, stroke, sw, fill){
    const r = between(8, 12), h = between(12, 18);
    return `<line x1="${x}" y1="${base}" x2="${x}" y2="${base-h}" stroke="${stroke}" stroke-width="${sw}"/>` +
           `<circle cx="${x}" cy="${base-h-r+2}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  }

  const pick = arr => arr[Math.floor(rand()*arr.length)];

  // janelas em 4 estilos diferentes (tudo num único <path> para ficar leve)
  function windows(x0, x1, y0, y1, style, stroke, sw){
    let d = '';
    if(style === 'dash'){                     // tracinhos
      for(let y = y0 + 14; y < y1 - 12; y += 12)
        for(let cx = x0 + 8; cx < x1 - 12; cx += 15) d += `M${cx} ${y}h8`;
    } else if(style === 'grid'){              // janelinhas quadradas
      for(let y = y0 + 12; y < y1 - 10; y += 13)
        for(let cx = x0 + 7; cx < x1 - 11; cx += 12) d += `M${cx} ${y}h5v6h-5z`;
    } else if(style === 'vlines'){            // fachada de vidro (linhas verticais)
      for(let cx = x0 + 7; cx < x1 - 5; cx += 8) d += `M${cx} ${y0+10}V${y1-8}`;
    } else if(style === 'bands'){             // varandas / lajes aparentes
      for(let y = y0 + 16; y < y1 - 6; y += 14) d += `M${x0} ${y}H${x1}`;
    }
    let lit = '';                                           // janelas acesas (amarelo/laranja)
    if(curOp >= .38){
      const rows = Math.floor((y1 - y0 - 20) / 13), cols = Math.floor((x1 - x0 - 16) / 12);
      if(rows > 0 && cols > 0){
        const n = Math.round(rows * cols * 0.012 + (rand2() < .12 ? 1 : 0));
        for(let i = 0; i < n; i++){
          const lx = x0 + 7 + Math.floor(rand2()*cols) * 12, ly = y0 + 12 + Math.floor(rand2()*rows) * 13;
          lit += `<rect x="${lx}" y="${ly}" width="6" height="7" fill="${rand2() < .6 ? LIT(curOp) : ACCENT(curOp)}"/>`;
        }
      }
    }
    return (d ? `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>` : '') + lit;
  }

  // guindaste de obra (a QM é construtora!), em laranja da marca
  function crane(cx, top, op, sw){
    const c = `rgba(196,100,58,${Math.min(1, op + .15)})`;
    const m = top - 74, j = top - 62;
    return `<path d="M${cx} ${top}V${m}M${cx-16} ${j}H${cx+60}M${cx} ${m}L${cx-16} ${j}M${cx} ${m}L${cx+60} ${j}M${cx+48} ${j}V${top-36}" fill="none" stroke="${c}" stroke-width="${sw}"/>` +
           `<rect x="${cx-22}" y="${j}" width="6" height="9" fill="none" stroke="${c}" stroke-width="${sw}"/>` +
           `<rect x="${cx+45}" y="${top-36}" width="6" height="6" fill="none" stroke="${c}" stroke-width="${sw}"/>`;
  }


  // ---- ITENS DE ENGENHARIA (laranja, traço fino, minimalistas como o guindaste) ----
  // no topo/fachada de alguns prédios: caixa d'água elevada, painéis solares, andaime
  function rooftop(x, w, top, h, op){
    if(w < 46 || top < 60) return '';
    const c = ORANGE(op), sw = (0.8 + op*0.6).toFixed(2);
    const at = `fill="none" stroke="${c}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`;
    const r = rand3();
    if(r < .14){                                                    // caixa d'água elevada
      const tx = x + w*0.5, tw = 14, th = 9, lh = 10, ty = top - lh - th;
      const d = `M${tx+1} ${top}V${top-lh}M${tx+tw-1} ${top}V${top-lh}M${tx+1} ${top}L${tx+tw-1} ${top-lh}M${tx+tw-1} ${top}L${tx+1} ${top-lh}` +
                `M${tx} ${ty}H${tx+tw}V${ty+th}H${tx}Z M${tx-1} ${ty}L${tx+tw/2} ${ty-5}L${tx+tw+1} ${ty}`;
      return `<path d="${d}" ${at}/>`;
    }
    if(r < .30){                                                    // painéis solares inclinados
      const n = Math.min(2, Math.floor(w*0.8/24)), a = x + w*0.15;
      let d = '';
      for(let i = 0; i < n; i++){
        const ax = a + i*24;
        d += `M${ax} ${top}L${ax+8} ${top-8}H${ax+22}L${ax+14} ${top}ZM${ax+4} ${top-4}H${ax+18}`;
      }
      return `<path d="${d}" ${at}/>`;
    }
    if(r < .38 && h > 80){                                          // andaime na fachada
      const fh = Math.min(h*0.5, 56), sx = x + 4, sw2 = Math.min(w*0.45, 26), y0 = top + 8;
      let d = `M${sx} ${y0}V${y0+fh}M${sx+sw2} ${y0}V${y0+fh}`;
      for(let y = y0; y + 14 <= y0 + fh; y += 14) d += `M${sx} ${y}H${sx+sw2}L${sx} ${y+14}M${sx+sw2} ${y+14}H${sx}`;
      return `<path d="${d}" ${at}/>`;
    }
    return '';
  }

  // cena de rua + silos e torre de energia (agro e infraestrutura de Patos de Minas)
  function engineering(){
    const sw = 1.4, cr = ORANGE(1), cf = ORANGE(.35);
    const at  = `fill="none" stroke="${cr}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`;
    const atf = `fill="none" stroke="${cf}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`;
    const g = GROUND;
    let o = '';

    // silos (lado esquerdo, mais ao fundo)
    o += `<path d="M14 ${g}V${g-48}Q22 ${g-60} 30 ${g-48}V${g}M14 ${g-32}H30M14 ${g-16}H30` +
         `M34 ${g}V${g-38}Q41 ${g-48} 48 ${g-38}V${g}M34 ${g-24}H48M22 ${g-58}V${g-66}" ${atf}/>`;
    // torre de transmissão de energia
    o += `<path d="M66 ${g}L75 ${g-68}L78 ${g-80}L81 ${g-68}L90 ${g}M62 ${g-60}H94M68 ${g-46}H88` +
         `M66 ${g}L87 ${g-24}L69 ${g-24}L84 ${g-46}L72 ${g-46}" ${atf}/>`;
    return o;
  }


  // comércio térreo: largo, baixo, com toldo e vitrines
  function shop(x, base, L, stroke, sw){
    const w = between(78, 108), h = between(46, 64), t = base - h;
    const at = `fill="none" stroke="${stroke}" stroke-width="${sw}"`;
    let o = `<rect x="${x}" y="${t}" width="${w}" height="${h}" fill="${L.fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    const oc = ACCENT(L.op);
    o += `<rect x="${x+w*0.3}" y="${t-9}" width="${w*0.4}" height="9" ${at}/>`;   // letreiro
    let d = `M${x} ${t+h*0.42}H${x+w}`;                                                           // faixa do toldo
    for(let cx = x; cx <= x + w; cx += 8) d += `M${cx} ${t+h*0.42}v7`;
    o += `<path d="${d}" fill="none" stroke="${oc}" stroke-width="${(sw*1.5).toFixed(2)}"/>`;   // toldo laranja
    o += `<rect x="${x+6}" y="${base-17}" width="${w*0.32}" height="17" ${at}/>`;              // vitrines
    o += `<rect x="${x+w*0.55}" y="${base-17}" width="${w*0.18}" height="17" ${at}/>`;
    o += `<rect x="${x+w*0.8}" y="${base-17}" width="8" height="17" ${at}/>`;                  // porta
    if(L.win) o += windows(x, x+w, t, t+h*0.42, 'grid', stroke, sw);
    return { out:o, w };
  }

  function build(L){
    const stroke = `rgba(108,147,180,${L.op})`;
    const sw = (0.8 + L.op*0.6).toFixed(2);
    const at = `fill="none" stroke="${stroke}" stroke-width="${sw}"`;
    const base = GROUND - L.dy;
    curOp = L.op;
    let x = L.start, out = '', prevHouse = false;
    while(x < W){
      // casas tendem a vir em fileiras de 2–3
      const chance = L.house(x) + (prevHouse ? 0.25 : 0);
      if(rand() < chance){
        const h = house(x, base, L, stroke, sw);
        out += h.out;
        x += h.w + between(...L.gap);
        prevHouse = true;
        if(L.trees && x < 700 && rand() < .8){
          out += tree(x + 8, base, stroke, sw, L.fill);
          x += 22;
        }
        continue;
      }
      prevHouse = false;

      const w = between(L.wMin, L.wMax);
      let top = GROUND - envelope(x + w/2) - L.lift + between(-L.jit, L.jit);
      top = Math.max(30, Math.min(top, base - 30));
      const h = base - top;

      // sorteia o TIPO do prédio (só entram os que cabem na altura disponível)
      const opts = [
        ['stepped', .15, h > 120],                         // escalonado (recuo no topo)
        ['antenna', .13, h > 100 && top > 50],             // com antena
        ['slanted', .15, true],                            // telhado inclinado (sobe pra direita)
        ['crane',   .07, h > 90 && top > 115 && L.dy <= 25], // obra com guindaste
        ['shop',    .12, L.dy <= 25 && x < 760]            // comércio térreo
      ];
      let kind = 'plain', acc = 0, r = rand();
      for(const [k, pr, ok] of opts){ if(ok){ acc += pr; if(r < acc){ kind = k; break; } } }

      if(kind === 'shop'){
        const sh = shop(x, base, L, stroke, sw);
        out += sh.out;
        x += sh.w + between(...L.gap);
        continue;
      }

      const style = L.win ? pick(['dash','grid','vlines','bands']) : null;
      const fillStroke = `fill="${L.fill}" stroke="${stroke}" stroke-width="${sw}"`;
      const cx = x + w/2;

      if(kind === 'stepped'){
        const inset = w * between(.18, .26), y1 = top + h * between(.28, .4);
        out += `<path d="M${x} ${base}V${y1}H${x+inset}V${top}H${x+w-inset}V${y1}H${x+w}V${base}Z" ${fillStroke}/>`;
        if(L.win){
          out += windows(x, x+w, y1, base, style, stroke, sw);
          out += windows(x+inset, x+w-inset, top, y1, style, stroke, sw);
        }
      } else if(kind === 'slanted'){
        const drop = between(16, 28);
        out += `<path d="M${x} ${base}V${top+drop}L${x+w} ${top}V${base}Z" ${fillStroke}/>`;
        if(L.win) out += windows(x, x+w, top + drop, base, style, stroke, sw);
      } else {
        out += `<rect x="${x}" y="${top}" width="${w}" height="${h}" ${fillStroke}/>`;
        if(L.win) out += windows(x, x+w, top, base, style, stroke, sw);
        if(kind === 'antenna'){
          const a = between(24, 40);
          out += `<path d="M${cx} ${top}V${top-a}M${cx-5} ${top-a*0.6}h10" ${at}/>`;
          out += `<circle cx="${cx}" cy="${top-a-2}" r="2.6" fill="${ACCENT(L.op)}"/>`;               // luz de aviso
        } else if(kind === 'crane'){
          if(rand2() < .5){                               // andares ainda sem fechar: estrutura laranja
            const oc = ORANGE(L.op), fh = Math.min(h * .4, 48);
            out += `<rect x="${x}" y="${top}" width="${w}" height="${fh}" fill="${L.fill}" stroke="none"/>`;
            let d = '';
            for(let cx2 = x; cx2 <= x + w + .1; cx2 += w/3) d += `M${cx2} ${top}V${top+fh}`;
            for(let y2 = top; y2 <= top + fh; y2 += 12) d += `M${x} ${y2}H${x+w}`;
            out += `<path d="${d}" fill="none" stroke="${oc}" stroke-width="${sw}"/>`;
          }
          out += crane(x + w*0.3, top, L.op, sw);
        } else if(h > 60 && rand() < .3){                 // caixa d'água / casa de máquinas
          out += `<rect x="${x+w*0.15}" y="${top-9}" width="12" height="9" ${fillStroke}/>`;
        }
        if(kind === 'plain' && L.dy <= 25) out += rooftop(x, w, top, h, L.op);   // engenharia: caixa d'água, solar, andaime
      }
      x += w + between(...L.gap);
    }
    return out;
  }

  svg.innerHTML = layers.map(build).join('') + engineering() +
    `<line x1="0" y1="${GROUND+1}" x2="${W}" y2="${GROUND+1}" stroke="#C4643A" stroke-width="2"/>`;
})();
