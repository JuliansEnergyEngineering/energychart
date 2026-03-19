// ===== CONSTANTS =====
const API_BASE_URL = 'https://energychart.julian-wymann.workers.dev/';
const BZN = 'CH';
let EUR_TO_CHF = 0.95;
const UPDATE_INTERVAL = 15 * 60 * 1000;

// ===== STATE =====
let todayData    = [];
let tomorrowData = [];
let currentView  = 'today'; // 'today' oder 'tomorrow'
let currentHour  = new Date().getHours();

// ===== CONVERSION =====
function toRappen(eurMwh) {
    return eurMwh * EUR_TO_CHF * 100 / 1000;
}
function fmtRp(eurMwh, dec = 2) {
    return toRappen(eurMwh).toFixed(dec);
}

// ===== EXCHANGE RATE =====
async function fetchExchangeRate() {
    try {
        const res  = await fetch('https://corsproxy.io/?https://api.frankfurter.app/latest?from=EUR&to=CHF');
        const data = await res.json();
        EUR_TO_CHF = data.rates.CHF;
        console.log('✅ Wechselkurs: 1 EUR = ' + EUR_TO_CHF.toFixed(4) + ' CHF');
    } catch (e) {
        console.warn('⚠️ Wechselkurs Fallback: 0.95');
    }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    showLoading(true);
    document.getElementById('refresh-btn').addEventListener('click', function() { loadAll(true); });
    await fetchExchangeRate();
    await loadAll();
    showLoading(false);
    setInterval(function() {
        fetchExchangeRate().then(function() { loadAll(); });
    }, UPDATE_INTERVAL);
}

// ===== LOAD ALL =====
async function loadAll(toast) {
    showLoading(true);
    try {
        const today = await fetchDay(new Date());
        todayData = today;

        const tomorrow = await fetchTomorrow();
        tomorrowData = tomorrow;

        // Zeige immer Heute zuerst
        showToday();

        if (toast) showToast('✅ Daten aktualisiert');
    } catch (e) {
        console.error(e);
        showToast('❌ Fehler beim Laden');
    }
    showLoading(false);
}

// ===== API =====
async function fetchDay(date) {
    const day = formatApiDate(date);
    const url = API_BASE_URL + '/price?bzn=' + BZN + '&start=' + day + '&end=' + day;
    const res  = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    return (json.unix_seconds || []).map(function(ts, i) {
        return { timestamp: ts * 1000, price: json.price[i] || 0, date: new Date(ts * 1000) };
    });
}

function formatApiDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
}

async function fetchTomorrow() {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return await fetchDay(tomorrow);
    } catch (e) {
        console.warn('⚠️ Morgen nicht verfügbar (wird um 12:40 veröffentlicht)');
        return [];
    }
}

// ===== TAB SWITCHING =====
function switchToToday() {
    currentView = 'today';
    document.getElementById('tab-today').classList.add('active');
    document.getElementById('tab-tomorrow').classList.remove('active');
    showToday();
}

function switchToTomorrow() {
    if (!tomorrowData || tomorrowData.length === 0) {
        showToast('⚠️ Morgen-Daten noch nicht verfügbar (ab 12:40 Uhr)');
        return;
    }
    currentView = 'tomorrow';
    document.getElementById('tab-today').classList.remove('active');
    document.getElementById('tab-tomorrow').classList.add('active');
    showTomorrow();
}

function showToday() {
    if (!todayData || todayData.length === 0) return;
    
    currentHour = new Date().getHours();
    updateUI(todayData, true);
    updateTimeline(todayData, true);
    drawMainChart(todayData, true);
    updateInsights(todayData);
    updateLastUpdate();
    
    setEl('chart-title', '24h Chart - Heute');
}

function showTomorrow() {
    if (!tomorrowData || tomorrowData.length === 0) return;
    
    currentHour = -1; // Kein "aktuell" für morgen
    updateUI(tomorrowData, false);
    updateTimeline(tomorrowData, false);
    drawMainChart(tomorrowData, false);
    updateInsights(tomorrowData);
    
    setEl('chart-title', '24h Chart - Morgen');
}

// ===== UI =====
function updateUI(data, isToday) {
    if (!data || !data.length) return;

    var current  = isToday ? (data.find(function(d){ return d.date.getHours() === currentHour; }) || data[data.length-1]) : data[0];
    var prices   = data.map(function(d){ return d.price; });
    var avg      = prices.reduce(function(a,b){ return a+b; }, 0) / prices.length;
    var min      = Math.min.apply(null, prices);
    var max      = Math.max.apply(null, prices);
    var minIdx   = prices.indexOf(min);
    var maxIdx   = prices.indexOf(max);
    var curIdx   = data.indexOf(current);
    var prev     = curIdx > 0 ? data[curIdx-1].price : current.price;
    var trendUp  = current.price > prev;
    var trendPct = prev ? ((current.price - prev) / prev * 100).toFixed(1) : '0.0';

    setEl('current-price', fmtRp(current.price));
    setEl('current-time',  fmtTime(current.date));
    setEl('min-price',     fmtRp(min));
    setEl('min-time',      fmtTime(data[minIdx].date));
    setEl('max-price',     fmtRp(max));
    setEl('max-time',      fmtTime(data[maxIdx].date));
    setEl('avg-price',     fmtRp(avg));

    var trendEl = document.getElementById('price-trend');
    if (trendEl) {
        trendEl.className = 'price-trend ' + (trendUp ? 'up' : 'down');
        var arrow = document.getElementById('trend-arrow');
        if (arrow) arrow.setAttribute('d', trendUp ? 'M8 4l6 6H2l6-6z' : 'M8 12l6-6H2l6 6z');
        setEl('trend-value', (trendUp ? '+' : '') + trendPct + '%');
    }
}

// ===== TIMELINE =====
function updateTimeline(data, isToday) {
    var el = document.getElementById('timeline');
    if (!el) return;
    el.innerHTML = '';
    var prices = data.map(function(d){ return d.price; });
    var avg    = prices.reduce(function(a,b){ return a+b; }, 0) / prices.length;

    data.forEach(function(point) {
        var h    = point.date.getHours();
        var item = document.createElement('div');
        item.className = 'timeline-item';
        
        if (isToday && h === currentHour)   item.classList.add('active');
        else if (point.price < avg * 0.85)  item.classList.add('cheap');
        else if (point.price > avg * 1.15)  item.classList.add('expensive');

        item.innerHTML =
            '<div class="timeline-time">' + h + ':00</div>' +
            '<div class="timeline-price">' + fmtRp(point.price) + '</div>' +
            '<div class="timeline-unit">Rp/kWh</div>';

        item.addEventListener('click', function() {
            document.querySelectorAll('.timeline-item').forEach(function(i){ i.classList.remove('active'); });
            item.classList.add('active');
            setEl('current-price', fmtRp(point.price));
            setEl('current-time', h + ':00');
        });
        el.appendChild(item);
    });

    if (isToday) {
        var active = el.querySelector('.timeline-item.active');
        if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

// ===== INSIGHTS =====
function updateInsights(data) {
    if (!data || !data.length) return;
    var prices   = data.map(function(d){ return d.price; });
    var avg      = prices.reduce(function(a,b){ return a+b; }, 0) / prices.length;
    var minP     = Math.min.apply(null, prices);
    var maxP     = Math.max.apply(null, prices);
    var saving   = ((maxP - minP) / maxP * 100).toFixed(0);

    var bestStart = 0, bestSum = Infinity;
    for (var i = 0; i <= data.length - 3; i++) {
        var s = data[i].price + data[i+1].price + data[i+2].price;
        if (s < bestSum) { bestSum = s; bestStart = i; }
    }
    var from = data[bestStart].date.getHours();
    var to   = data[Math.min(bestStart+2, data.length-1)].date.getHours();

    var insightEl = document.getElementById('insight-text');
    if (insightEl) {
        insightEl.innerHTML =
            'Günstigste 3h: <strong>' + from + ':00–' + to + ':00 Uhr</strong>' +
            ' mit ⌀ <strong>' + fmtRp(bestSum/3) + ' Rp./kWh</strong>.' +
            ' Spare bis zu <strong>' + saving + '%</strong> gegenüber Spitzenzeiten.';
    }
}

// ===== MAIN CHART =====
function drawMainChart(data, isToday) {
    var canvas = document.getElementById('mainChart');
    if (!canvas) return;
    var ctx  = canvas.getContext('2d');
    var dpr  = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    var W  = rect.width, H = rect.height;
    var PL = 52, PR = 12, PT = 24, PB = 28;
    var cW = W-PL-PR, cH = H-PT-PB;

    var prices = data.map(function(d){ return d.price; });
    var minP   = Math.min.apply(null, prices);
    var maxP   = Math.max.apply(null, prices);
    var range  = maxP - minP || 1;
    var avg    = prices.reduce(function(a,b){ return a+b; },0) / prices.length;
    var xOf    = function(i){ return PL + (i/(prices.length-1))*cW; };
    var yOf    = function(p){ return PT + cH - ((p-minP)/range)*cH; };

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    [0,.25,.5,.75,1].forEach(function(t){
        var y = PT + t*cH;
        ctx.beginPath(); ctx.moveTo(PL,y); ctx.lineTo(W-PR,y); ctx.stroke();
    });

    var avgY = yOf(avg);
    ctx.strokeStyle = 'rgba(139,147,176,0.25)';
    ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(PL,avgY); ctx.lineTo(W-PR,avgY); ctx.stroke();
    ctx.setLineDash([]);

    var grad = ctx.createLinearGradient(0,PT,0,PT+cH);
    grad.addColorStop(0,'rgba(0,102,255,0.18)');
    grad.addColorStop(1,'rgba(0,102,255,0)');
    ctx.beginPath();
    ctx.moveTo(xOf(0), PT+cH);
    prices.forEach(function(p,i){ ctx.lineTo(xOf(i),yOf(p)); });
    ctx.lineTo(xOf(prices.length-1), PT+cH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    prices.forEach(function(p,i){
        if(i===0) return;
        ctx.strokeStyle = p < avg*0.85 ? '#00D9A3' : p > avg*1.15 ? '#FF3B5C' : '#0066FF';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(xOf(i-1), yOf(prices[i-1]));
        ctx.lineTo(xOf(i),   yOf(p));
        ctx.stroke();
    });

    if (isToday) {
        var curIdx = -1;
        data.forEach(function(d,i){ if(d.date.getHours()===currentHour) curIdx=i; });
        if (curIdx >= 0) {
            ctx.fillStyle = '#0066FF';
            ctx.beginPath(); ctx.arc(xOf(curIdx), yOf(prices[curIdx]), 5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(xOf(curIdx), yOf(prices[curIdx]), 2.5, 0, Math.PI*2); ctx.fill();
        }
    }

    ctx.fillStyle = '#8B93B0';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(fmtRp(maxP,1), PL-6, PT+4);
    ctx.fillText(fmtRp(minP,1), PL-6, PT+cH+4);
    ctx.fillText(fmtRp(avg,1),  PL-6, avgY+4);

    ctx.textAlign = 'center';
    for (var i = 0; i < data.length; i+=4) {
        ctx.fillText(data[i].date.getHours()+':00', xOf(i), H-6);
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = '#5A6178';
    ctx.fillText('Rp./kWh', PL, PT-8);
}

// ===== HELPERS =====
function setEl(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
}
function fmtTime(date) {
    return date.toLocaleTimeString('de-CH', { hour:'2-digit', minute:'2-digit' });
}
function showLoading(on) {
    var el = document.getElementById('loading');
    if (el) el.classList.toggle('hidden', !on);
}
function showToast(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.remove('hidden');
    setTimeout(function(){ t.classList.add('hidden'); }, 3000);
}
function updateLastUpdate() {
    setEl('last-update', new Date().toLocaleString('de-CH', {
        day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'
    }));
}
window.addEventListener('resize', function() {
    if (currentView === 'today' && todayData.length) drawMainChart(todayData, true);
    if (currentView === 'tomorrow' && tomorrowData.length) drawMainChart(tomorrowData, false);
});
