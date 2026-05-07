/* Edward Frey Recruiting Page — runtime */
(async function(){
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
  const fmt = n => (n==null||isNaN(n))?'—':(Math.round(n*100)/100).toFixed(2);
  const fmt1 = n => (n==null||isNaN(n))?'—':(Math.round(n*10)/10).toFixed(1);
  const monShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const ord = n => { const s=['th','st','nd','rd'], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); };
  const dShort = iso => { const d = new Date(iso+'T12:00'); return monShort[d.getMonth()]+' '+d.getDate(); };
  const dShortOrd = iso => { const d = new Date(iso+'T12:00'); return monShort[d.getMonth()]+' '+ord(d.getDate()); };
  const dLong = iso => { const d = new Date(iso+'T12:00'); return monShort[d.getMonth()]+' '+d.getDate()+', '+d.getFullYear(); };

  let data;
  try {
    const res = await fetch('./data.json');
    data = await res.json();
  } catch(e){
    $('#loading').textContent = 'Failed to load data.json';
    return;
  }
  $('#loading').remove();

  const CURRENT_SEASON = 2025;
  const COL = { blue:'#4A9EFF', gold:'#FFB800', red:'#FF6B6B', green:'#00C896', mu:'rgba(255,255,255,0.72)', di:'rgba(255,255,255,0.40)', bdr:'#1E3A5F' };

  /* ============ HEADER STAMPS ============ */
  $('#hUpdate').textContent = dLong(data.lastUpdated);
  $('#fUpdate').textContent = 'LAST UPDATED · '+dLong(data.lastUpdated).toUpperCase();

  /* ============ HERO HIGHLIGHTS ============ */
  // Season highlights: pick a couple of standout results from current season.
  const meets = data.meets;
  const cs = meets.filter(m=>m.seasonYear===CURRENT_SEASON);
  const sectionWin = cs.find(m=>m.id==='s10-6aa-sec-1m'); // Section champ
  const ttChamp = cs.find(m=>m.id==='s10-tt-aa-state-1m'); // True Team champion
  const usadCs = cs.filter(m=>['USAD','AAU'].includes(m.orgGroup));
  const bestUsad = usadCs.length? usadCs.reduce((a,b)=>a.avgDiveScore>b.avgDiveScore?a:b) : null;

  const aaState = cs.find(m=>m.id==='s10-aa-state-1m');

  const hl = $('#hHighlights');
  const hlData = [];
  // 1. GPA card
  hlData.push({lbl:'GPA · Unweighted', val:data.academics.gpaUnweighted.toFixed(2), meta:'Through Grade 10 Sem 1', cls:'gold'});
  if (sectionWin) hlData.push({lbl:'1M · Section Champion · 1st', val:fmt(sectionWin.totalScore), avg:fmt(sectionWin.avgDiveScore), meta:'6AA · 11 dives · '+dShortOrd(sectionWin.meetDate), cls:'gold'});
  if (ttChamp) hlData.push({lbl:'1M · True Team State · 1st', val:fmt(ttChamp.totalScore), avg:fmt(ttChamp.avgDiveScore), meta:'AA State · 11 dives · '+dShortOrd(ttChamp.meetDate), cls:'gold'});
  if (aaState) hlData.push({lbl:'1M · AA State · 2nd', val:fmt(aaState.totalScore), avg:fmt(aaState.avgDiveScore), meta:'Runner-Up · 11 dives · '+dShortOrd(aaState.meetDate), cls:'gold'});
  if (bestUsad) hlData.push({lbl:'1M USAD Region 8 · 4th', val:fmt(bestUsad.totalScore), avg:fmt(bestUsad.avgDiveScore), meta:`${bestUsad.numDives} dives · `+dShortOrd(bestUsad.meetDate), cls:'blue'});
  const region8_3m = meets.find(m=>m.id==='s10-region8-3m');
  if (region8_3m) hlData.push({lbl:`3M USAD Region 8 · ${ord(region8_3m.finalPlace)}`, val:fmt(region8_3m.totalScore), avg:fmt(region8_3m.avgDiveScore), meta:`${region8_3m.numDives} dives · `+dShortOrd(region8_3m.meetDate), cls:'blue'});
  hl.innerHTML = hlData.slice(0,6).map(h=>`
    <div class="hl ${h.cls}">
      <div class="lbl">${h.lbl}</div>
      <div class="val">${h.val}${h.avg?`<span class="avg">(${h.avg})</span>`:''}</div>
      <div class="meta">${h.meta}</div>
    </div>`).join('');

  /* ============ KPI STRIP ============ */
  function bestMatching(filter, season){
    const arr = meets.filter(m=>m.seasonYear===season).filter(filter);
    if(!arr.length) return null;
    return arr.reduce((a,b)=>a.avgDiveScore>b.avgDiveScore?a:b);
  }
  const kpiDefs = [
    { lbl:'HS DUAL BEST · 6 DIVES', col:'var(--gold)', filter:m=>m.eventFormat==='Dual Meet'&&m.numDives===6&&m.orgGroup==='MSHSL' },
    { lbl:'HS CHAMP BEST · 11 DIVES', col:'var(--gold)', filter:m=>m.eventFormat==='Championship'&&m.numDives===11&&m.orgGroup==='MSHSL' },
    { lbl:'USAD BEST · 10 DIVES', col:'var(--blue)', filter:m=>['USAD','AAU'].includes(m.orgGroup) }
  ];
  const kpiHtml = kpiDefs.map(k=>{
    const cur = bestMatching(k.filter, CURRENT_SEASON);
    const prev = bestMatching(k.filter, CURRENT_SEASON-1);
    let delta = '';
    if (cur && prev){
      const d = cur.avgDiveScore - prev.avgDiveScore;
      const sign = d>=0?'+':'';
      delta = `<div class="delta${d<0?' neg':''}">${sign}${fmt(d)} vs prior season</div>`;
    } else if (cur && !prev){
      delta = `<div class="delta">First season</div>`;
    }
    return `<div class="kpi" style="--col:${k.col}">
      <div class="lbl">${k.lbl}</div>
      <div class="val">${cur?fmt(cur.avgDiveScore):'—'}</div>
      <div class="ctx">${cur?cur.meetAbbrev+' · '+dShort(cur.meetDate):'No data this season'}</div>
      ${delta}
    </div>`;
  }).join('');
  $('#kpiStrip').innerHTML = kpiHtml;

  /* ============ TOOLTIP HELPERS ============ */
  const tt = $('#tt');
  function showTT(html, x, y){
    tt.innerHTML = html;
    tt.style.display='block';
    const r = tt.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    let nx = x+12, ny = y+12;
    if (nx+r.width>vw-8) nx = x-r.width-12;
    if (ny+r.height>vh-8) ny = y-r.height-12;
    tt.style.left = nx+'px'; tt.style.top = ny+'px';
  }
  function hideTT(){ tt.style.display='none'; }
  document.addEventListener('scroll', hideTT, true);

  /* ============ CHART BUILDER ============ */
  Chart.defaults.font.family = "'DM Sans', sans-serif";
  Chart.defaults.color = COL.mu;
  Chart.defaults.font.size = 10;

  function buildTrajectory(canvasId, predicate, opts){
    const arr = meets.filter(predicate).sort((a,b)=>a.meetDate.localeCompare(b.meetDate));
    if(!arr.length) return null;

    // Build per-board point arrays with real {x:ms, y:score, meet} objects
    const toMs = iso => new Date(iso+'T12:00').getTime();
    const pts1 = arr.filter(m=>m.board==='1M').map(m=>({x:toMs(m.meetDate), y:m.avgDiveScore, m}));
    const pts3 = arr.filter(m=>m.board==='3M').map(m=>({x:toMs(m.meetDate), y:m.avgDiveScore, m}));

    // Season boundaries: detect year transitions in chronological order
    const seasonBreaks = [];
    let lastSeason = arr[0].seasonYear;
    for (let i=1;i<arr.length;i++){
      if (arr[i].seasonYear !== lastSeason){
        // midpoint between previous meet and this meet, in ms
        const t = (new Date(arr[i-1].meetDate+'T12:00').getTime() + new Date(arr[i].meetDate+'T12:00').getTime())/2;
        seasonBreaks.push({t, label:opts.seasonLabel(arr[i].seasonYear)});
        lastSeason = arr[i].seasonYear;
      }
    }

    const sepPlugin = {
      id:'seasonSep',
      afterDraw(chart){
        const {ctx, chartArea, scales} = chart;
        ctx.save();
        ctx.setLineDash([3,4]); ctx.lineWidth=1; ctx.strokeStyle='rgba(255,255,255,0.10)';
        seasonBreaks.forEach(sb=>{
          const x = scales.x.getPixelForValue(sb.t);
          if (x < chartArea.left || x > chartArea.right) return;
          ctx.beginPath(); ctx.moveTo(x, chartArea.top); ctx.lineTo(x, chartArea.bottom); ctx.stroke();
          ctx.setLineDash([]);
          ctx.font = '500 9px "JetBrains Mono",monospace';
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.textAlign='center';
          ctx.fillText(sb.label, x, chartArea.top+10);
          ctx.setLineDash([3,4]);
        });
        ctx.restore();

        // end-of-line labels — positioned in right padding, stacked to avoid overlap
        ctx.save();
        ctx.font = '700 10px "DM Sans",sans-serif';
        const labelX = chartArea.right + 6;
        const ends = [];
        chart.data.datasets.forEach((ds,di)=>{
          if (chart.getDatasetMeta(di).hidden) return;
          if (!ds.data.length) return;
          const last = ds.data[ds.data.length-1];
          const px = scales.x.getPixelForValue(last.x);
          const py = scales.y.getPixelForValue(last.y);
          ends.push({ds, px, py, ty:py});
        });
        ends.sort((a,b)=>a.py-b.py);
        const minGap = 14;
        for(let i=1;i<ends.length;i++){
          if (ends[i].ty - ends[i-1].ty < minGap) ends[i].ty = ends[i-1].ty + minGap;
        }
        ends.forEach(e=>{ e.ty = Math.max(chartArea.top+6, Math.min(chartArea.bottom-2, e.ty)); });
        ends.forEach(e=>{
          ctx.strokeStyle = e.ds.borderColor; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(e.px+1, e.py); ctx.lineTo(labelX-3, e.ty); ctx.stroke();
          ctx.fillStyle = e.ds.borderColor;
          ctx.textAlign='left'; ctx.textBaseline='middle';
          ctx.fillText(e.ds.label, labelX, e.ty);
        });
        ctx.textBaseline='alphabetic';
        ctx.restore();
      }
    };

    const ptr = (col, failCol) => ({
      pointRadius:(c)=>{ const p=c.raw; return p&&p.m.penalized?5:4; },
      pointHoverRadius:6,
      pointBackgroundColor:(c)=>{ const p=c.raw; return p&&p.m.penalized?'rgba(0,0,0,0)':col; },
      pointBorderColor:(c)=>{ const p=c.raw; return p&&p.m.penalized?failCol:col; },
      pointBorderWidth:(c)=>{ const p=c.raw; return p&&p.m.penalized?2:0; }
    });

    const ctx = $('#'+canvasId).getContext('2d');
    const chart = new Chart(ctx, {
      type:'line',
      data:{
        datasets:[
          Object.assign({ label:'1M', data:pts1, borderColor:COL.blue, backgroundColor:COL.blue, borderWidth:2.5, tension:0.3 }, ptr(COL.blue, COL.red)),
          Object.assign({ label:'3M', data:pts3, borderColor:COL.gold, backgroundColor:COL.gold, borderWidth:2.5, tension:0.3 }, ptr(COL.gold, COL.red))
        ]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        layout:{padding:{right:42, top:14}},
        interaction:{mode:'nearest', intersect:false},
        parsing:false,
        scales:{
          y:{ min:0, max:60, ticks:{stepSize:15, color:COL.di, font:{size:9}}, grid:{color:'rgba(255,255,255,0.06)', drawBorder:false}, border:{display:false} },
          x:{
            type:'time',
            time:{ unit:'month', tooltipFormat:'MMM D, YYYY', displayFormats:{month:'MMM YY'} },
            ticks:{maxRotation:0, autoSkip:true, autoSkipPadding:14, color:COL.di, font:{size:9}},
            grid:{display:false}, border:{color:COL.bdr}
          }
        },
        plugins:{
          legend:{display:false},
          tooltip:{
            backgroundColor:'#0a1830', borderColor:COL.bdr, borderWidth:1,
            titleColor:'#fff', bodyColor:COL.mu, padding:10, cornerRadius:6,
            callbacks:{
              title:(items)=>items[0].raw.m.meetAbbrev,
              label:(item)=>{
                const m = item.raw.m;
                const lines = [
                  `${m.board} · avg ${fmt(m.avgDiveScore)}`,
                  `Place ${m.finalPlace} · ${m.numDives} dives · total ${fmt(m.totalScore)}`,
                  dLong(m.meetDate)
                ];
                if (m.penalized) lines.push('⚠ Failed dive (F flag)');
                return lines;
              }
            }
          }
        }
      },
      plugins:[sepPlugin]
    });
    return chart;
  }

  const usadChart = buildTrajectory('cUsad',
    m=>['USAD','AAU'].includes(m.orgGroup),
    { seasonLabel:y=>'S'+y }
  );
  const hsChart = buildTrajectory('cHs',
    m=>m.orgGroup==='MSHSL',
    { seasonLabel:y=>{ const grade = y-2015; return 'G'+grade; } }
  );

  // Board toggles for charts
  $$('.toggle[data-board="usad"] button').forEach(b=>b.onclick = ()=>setBoardChart(usadChart, 'usad', b.dataset.b));
  $$('.toggle[data-board="hs"] button').forEach(b=>b.onclick = ()=>setBoardChart(hsChart, 'hs', b.dataset.b));
  function setBoardChart(chart, key, val){
    if (!chart) return;
    $$(`.toggle[data-board="${key}"] button`).forEach(b=>b.classList.toggle('active', b.dataset.b===val));
    chart.getDatasetMeta(0).hidden = !(val==='1M'||val==='BOTH');
    chart.getDatasetMeta(1).hidden = !(val==='3M'||val==='BOTH');
    chart.update();
  }

  /* ============ HEATMAP ============ */
  let hmBoard = '1M';
  let hmOrg = 'USAD';

  function syncHmToggles(){
    // HS only has 1M data → disable 3M button when HS active
    const btn3M = $('.toggle[data-board="hm"] button[data-b="3M"]');
    const btn1M = $('.toggle[data-board="hm"] button[data-b="1M"]');
    const btnHS = $('.toggle[data-board="hmOrg"] button[data-o="HS"]');
    const btnUS = $('.toggle[data-board="hmOrg"] button[data-o="USAD"]');

    btn3M.disabled = (hmOrg==='HS');
    btnHS.disabled = (hmBoard==='3M');

    btn1M.classList.toggle('active', hmBoard==='1M');
    btn3M.classList.toggle('active', hmBoard==='3M');
    btnHS.classList.toggle('active', hmOrg==='HS');
    btnUS.classList.toggle('active', hmOrg==='USAD');
  }

  $$('.toggle[data-board="hm"] button').forEach(b=>b.onclick = ()=>{
    if (b.disabled) return;
    hmBoard = b.dataset.b;
    // selecting 3M auto-switches org to USAD (HS has no 3M)
    if (hmBoard==='3M') hmOrg = 'USAD';
    syncHmToggles();
    renderHeatmap();
  });
  $$('.toggle[data-board="hmOrg"] button').forEach(b=>b.onclick = ()=>{
    if (b.disabled) return;
    hmOrg = b.dataset.o;
    // selecting HS auto-switches board to 1M (HS is 1M only)
    if (hmOrg==='HS') hmBoard = '1M';
    syncHmToggles();
    renderHeatmap();
  });

  function renderHeatmap(){
    const dives = data.dives;
    const meetById = Object.fromEntries(meets.map(m=>[m.id,m]));
    const targetOrgs = hmOrg==='HS' ? ['MSHSL'] : ['USAD','AAU'];
    const seasonDives = dives.filter(d=>{
      const m = meetById[d.meetId];
      if(!m) return false;
      if (m.seasonYear !== CURRENT_SEASON) return false;
      if (!targetOrgs.includes(m.orgGroup)) return false;
      if (d.board !== hmBoard) return false;
      return true;
    });

    const grid = $('#hmGrid');
    if (!seasonDives.length){
      grid.style.gridTemplateColumns = '1fr';
      grid.innerHTML = `<div style="padding:36px 12px;text-align:center;color:var(--mu);font-size:12px;line-height:1.6">
        <div style="font-family:var(--fh);font-size:16px;color:var(--w);font-weight:700;letter-spacing:.3px;margin-bottom:6px">No dive-level data</div>
        ${hmOrg==='HS'
          ? 'High school meets report total scores only.<br>Per-dive breakdowns are USA Diving sanctioned only.'
          : 'No USAD dive data for this filter.'}
      </div>`;
      return;
    }

    // Determine meet columns (sorted by date), grouped by board if BOTH
    const meetIds = [...new Set(seasonDives.map(d=>d.meetId))];
    const cols = meetIds.map(id=>meetById[id]).sort((a,b)=>a.meetDate.localeCompare(b.meetDate));

    // Determine rows: dive code + category, split into Vol then Opt
    const rowKey = d => d.diveCode+'|'+d.category+'|'+d.dd;
    const rowMap = {};
    seasonDives.forEach(d=>{
      const k = rowKey(d);
      if(!rowMap[k]) rowMap[k] = { code:d.diveCode, cat:d.category, dd:d.dd, desc:d.diveDescription };
    });
    const rowsArr = Object.values(rowMap);
    const volRows = rowsArr.filter(r=>r.cat==='Vol').sort((a,b)=>b.dd-a.dd);
    const optRows = rowsArr.filter(r=>r.cat==='Opt').sort((a,b)=>b.dd-a.dd);

    // PB per dive code (across all dives in this filter)
    const pbByCode = {};
    seasonDives.forEach(d=>{
      if (d.failed) return;
      if (!pbByCode[d.diveCode] || d.diveScore>pbByCode[d.diveCode]) pbByCode[d.diveCode] = d.diveScore;
    });

    // Per-meet avg (non-failed dives)
    const avgByMeet = {};
    cols.forEach(m=>{
      const ms = seasonDives.filter(d=>d.meetId===m.id && !d.failed);
      avgByMeet[m.id] = ms.length ? ms.reduce((a,b)=>a+b.diveScore,0)/ms.length : null;
    });

    // Heat range per row
    const rangeByCode = {};
    Object.entries(pbByCode).forEach(([code])=>{
      const vals = seasonDives.filter(d=>d.diveCode===code && !d.failed).map(d=>d.diveScore);
      if(vals.length) rangeByCode[code] = { min:Math.min(...vals), max:Math.max(...vals) };
    });

    function heatColor(v, min, max){
      if (max-min<0.01) return {bg:'#3a8a5a', fg:'#fff'};
      const t = (v-min)/(max-min); // 0..1
      // red(t=0) -> white(t=.5) -> green(t=1)
      let r,g,b;
      if (t<.5){
        const k = t/0.5;
        r = 220 + (255-220)*k; g = 90 + (255-90)*k; b = 90 + (255-90)*k;
      } else {
        const k = (t-0.5)/0.5;
        r = 255 + (0-255)*k; g = 255 + (200-255)*k; b = 255 + (150-255)*k;
      }
      const lum = (0.299*r + 0.587*g + 0.114*b)/255;
      return { bg:`rgb(${r|0},${g|0},${b|0})`, fg: lum>0.58 ? '#0a1424' : '#fff' };
    }

    // Build grid
    const totalCols = 1 + cols.length + 1; // row-h + meets + PB
    const colTpl = `90px repeat(${cols.length}, 56px) 56px`;
    grid.style.gridTemplateColumns = colTpl;

    let html = '';
    // header row: corner + meets + PB
    html += `<div class="corner"></div>`;
    cols.forEach(m=>{
      const isUsad = ['USAD','AAU'].includes(m.orgGroup);
      const cls = isUsad ? 'blue' : 'gold';
      let tier = '';
      if (m.eventFormat==='Dual Meet') tier='Dual';
      else if (m.eventFormat==='Championship') tier=(m.notes||'').includes('State')||m.meetAbbrev.includes('State')?'State':'Champ';
      else if (m.eventFormat==='National') tier=m.meetAbbrev.includes('National')?'Nat':'Region';
      else if (m.eventFormat==='Circuit') tier='Circuit';
      html += `<div class="hh ${cls}" data-meetid="${m.id}">
        <div class="nm">${m.meetAbbrev}</div>
        <div class="dt">${dShort(m.meetDate)}</div>
        <div class="tier">${tier} · ${m.board}</div>
      </div>`;
    });
    html += `<div class="hh pb-h"><div class="nm" style="color:var(--gold)">PB</div><div class="dt">season</div></div>`;

    // rows by category
    function renderRows(rows, label){
      if(!rows.length) return;
      html += `<div class="cat-label">${label}</div>`;
      rows.forEach(r=>{
        html += `<div class="row-h"><div class="code">${r.code}</div><div class="dd">DD ${r.dd.toFixed(1)} · ${r.desc.length>22?r.desc.slice(0,22)+'…':r.desc}</div></div>`;
        cols.forEach(m=>{
          const dv = seasonDives.find(d=>d.meetId===m.id && d.diveCode===r.code && d.category===r.cat);
          if(!dv){ html += `<div class="cell empty"></div>`; return; }
          if(dv.failed){
            html += `<div class="cell fail" data-tt="fail|${m.id}|${r.code}">F</div>`; return;
          }
          const rng = rangeByCode[r.code] || {min:0,max:60};
          const c = heatColor(dv.diveScore, rng.min, rng.max);
          const isPB = pbByCode[r.code]!=null && Math.abs(dv.diveScore-pbByCode[r.code])<0.01;
          html += `<div class="cell" style="background:${c.bg};color:${c.fg}" data-tt="dv|${m.id}|${r.code}">
            ${fmt1(dv.diveScore)}${isPB?'<span class="pr">★</span>':''}
          </div>`;
        });
        // PB column
        const pb = pbByCode[r.code];
        html += `<div class="cell pb-col">${pb!=null?fmt1(pb):'—'}</div>`;
      });
    }
    renderRows(volRows, 'Voluntary');
    renderRows(optRows, 'Optional');

    // avg row
    html += `<div class="avg-h">Meet avg</div>`;
    cols.forEach(m=>{
      const v = avgByMeet[m.id];
      html += `<div class="cell avg-cell">${v!=null?fmt1(v):'—'}</div>`;
    });
    html += `<div class="cell avg-cell" style="background:rgba(255,184,0,0.12);border-color:rgba(255,184,0,0.4);color:var(--gold)">—</div>`;

    grid.innerHTML = html;

    // tooltips
    grid.querySelectorAll('[data-tt]').forEach(el=>{
      el.addEventListener('mouseenter', ev=>{
        const [kind, mid, code] = el.dataset.tt.split('|');
        const m = meetById[mid];
        const dv = seasonDives.find(d=>d.meetId===mid && d.diveCode===code);
        if(!dv) return;
        const html = kind==='fail'
          ? `<div><b>${dv.diveCode}</b> · ${dv.diveDescription}</div>
             <div class="mu">DD ${dv.dd}</div>
             <div class="red">⚠ Failed dive · score 0</div>
             <div class="mu">${m.meetAbbrev} · ${dLong(m.meetDate)}</div>`
          : `<div><b>${dv.diveCode}</b> · ${dv.diveDescription}</div>
             <div class="mu">DD ${dv.dd} · ${dv.category==='Opt'?'Optional':'Voluntary'}</div>
             <div>Score <b>${fmt(dv.diveScore)}</b> · net ${fmt(dv.netScore)}</div>
             <div class="mu">${m.meetAbbrev} · ${dLong(m.meetDate)}</div>`;
        showTT(html, ev.clientX, ev.clientY);
      });
      el.addEventListener('mousemove', ev=>{ if(tt.style.display!=='none') showTT(tt.innerHTML, ev.clientX, ev.clientY); });
      el.addEventListener('mouseleave', hideTT);
    });

    grid.querySelectorAll('.hh[data-meetid]').forEach(el=>{
      el.addEventListener('mouseenter', ev=>{
        const m = meetById[el.dataset.meetid];
        const html = `<div><b>${m.meetName}</b></div>
          <div class="mu">${m.eventFormat} · ${m.board} · ${m.numDives} dives</div>
          <div>Place <b>${m.finalPlace}</b> · total ${fmt(m.totalScore)} · avg ${fmt(m.avgDiveScore)}</div>
          <div class="mu">${m.locationCity}, ${m.locationState} · ${dLong(m.meetDate)}</div>`;
        showTT(html, ev.clientX, ev.clientY);
      });
      el.addEventListener('mouseleave', hideTT);
    });
  }
  syncHmToggles();
  renderHeatmap();

  /* ============ ACADEMICS ACCORDION ============ */
  const ac = data.academics;
  const inner = $('#accInner');

  // Group completed courses by year+sem
  const completed = ac.completedCourses;
  const grouped = {};
  completed.forEach(c=>{
    const k = `Grade ${c.year} · Sem ${c.semester}`;
    (grouped[k] ||= []).push(c);
  });
  const groupKeys = Object.keys(grouped);

  function badgeFor(c){
    if (c.ap || c.level==='ap') return '<span class="badge b-ap">AP</span>';
    if (c.level==='enriched') return '<span class="badge b-en">ENR</span>';
    return '';
  }

  let acHtml = `
    <div class="stat-row">
      <div class="statbox">
        <div class="lbl">GPA · UNWEIGHTED</div>
        <div class="val">${ac.gpaUnweighted.toFixed(2)}</div>
        <div class="ctx">Across ${completed.length} completed courses through Grade 10 Sem 1</div>
      </div>
      <div class="statbox">
        <div class="lbl">TEST SCORES</div>
        <div class="val sm">PSAT · Fall 2026<br>ACT · Spring 2027</div>
        <div class="ctx">Scheduled — no scores yet</div>
      </div>
    </div>
  `;

  groupKeys.forEach(gk=>{
    const items = grouped[gk];
    acHtml += `<div class="cgroup"><div class="gh">${gk}</div>`;
    items.forEach(c=>{
      acHtml += `<div class="course">
        <div class="nm">${c.name}<small>${c.subject}</small></div>
        ${badgeFor(c)}
        <div class="gr">${c.grade}</div>
      </div>`;
    });
    acHtml += `</div>`;
  });

  // Planned
  const g11 = ac.plannedCourses.filter(p=>p.year===11);
  const g12 = ac.plannedCourses.filter(p=>p.year===12);
  function plannedBlock(label, list){
    return `<div class="cgroup"><div class="gh">${label} · planned</div>` +
      list.map(c=>`<div class="course">
        <div class="nm">${c.name}<small>${c.subject}</small></div>
        ${badgeFor(c)}
        <div class="gr" style="color:var(--mu);font-size:11px">—</div>
      </div>`).join('') + `</div>`;
  }
  acHtml += plannedBlock('Grade 11', g11);
  acHtml += plannedBlock('Grade 12', g12);

  acHtml += `<div class="notes">
    <b>Upward GPA trend</b> across 3 completed semesters · AP Chemistry as a sophomore (A−) · Honor Roll Grades 9 & 10 · French through level 5 with AP French planned.
  </div>`;

  inner.innerHTML = acHtml;

  $('#accGpa').textContent = ac.gpaUnweighted.toFixed(2);
  $('#accHead').addEventListener('click', ()=>{
    $('#acc').classList.toggle('open');
  });

  /* ============ SCROLL HELPERS / STICKY NAV ============ */
  document.querySelectorAll('[data-scroll]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const target = document.getElementById(el.dataset.scroll);
      if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });

  // Sticky nav appears once hero out of viewport
  const heroEl = $('#hero');
  const snav = $('#snav');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      snav.classList.toggle('show', !e.isIntersecting);
    });
  }, {threshold:0.05});
  io.observe(heroEl);

  // Highlight reel buttons (no URL yet)
  function reelClick(){
    const url = (data.video && data.video.highlightReelUrl) || '';
    if (url) window.open(url,'_blank','noopener');
    else alert('Highlight reel link coming soon.');
  }
  $('#btnReel').addEventListener('click', reelClick);
  $('#btnReel2').addEventListener('click', reelClick);

})();
