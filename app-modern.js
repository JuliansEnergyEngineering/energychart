// ===== CONSTANTS =====
const API_BASE_URL = 'https://api.energy-charts.info';
const BZN = 'CH';
const EUR_TO_CHF = 0.95;
const UPDATE_INTERVAL = 15 * 60 * 1000; // 15 Minuten

// ===== STATE =====
let priceData = [];
let currentHour = new Date().getHours();
let sparklineChart = null;
let mainChart = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Event Listeners
    document.getElementById('refresh-btn')?.addEventListener('click', () => loadData(true));
    
    // Initial Load
    await loadData();
    
    // Auto-refresh
    setInterval(() => loadData(), UPDATE_INTERVAL);
}

// ===== DATA LOADING =====
async function loadData(showToast = false) {
    showLoading(true);
    
    try {
        const data = await fetchPriceData();
        priceData = data;
        
        updateUI(data);
        updateCharts(data);
        updateTimeline(data);
        updateLastUpdate();
        
        if (showToast) {
            showToastMessage('✅ Daten aktualisiert');
        }
    } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        showToastMessage('❌ Fehler beim Laden');
    } finally {
        showLoading(false);
    }
}

async function fetchPriceData() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const url = `${API_BASE_URL}/price?bzn=${BZN}&year=${year}&month=${month}&day=${day}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    const timestamps = data.unix_seconds || [];
    const prices = data.price || [];
    
    return timestamps.map((timestamp, index) => ({
        timestamp: timestamp * 1000,
        price: prices[index] || 0,
        date: new Date(timestamp * 1000)
    }));
}

// ===== UI UPDATES =====
function updateUI(data) {
    if (!data || data.length === 0) {
        showToastMessage('❌ Keine Daten verfügbar');
        return;
    }
    
    const now = new Date();
    currentHour = now.getHours();
    
    // Finde aktuellen Preis
    const currentPrice = data.find(d => d.date.getHours() === currentHour) || data[0];
    
    // Statistiken
    const prices = data.map(d => d.price);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minIndex = prices.indexOf(minPrice);
    const maxIndex = prices.indexOf(maxPrice);
    
    // Trend berechnen
    const previousPrice = data[Math.max(0, currentHour - 1)]?.price || currentPrice.price;
    const trend = currentPrice.price > previousPrice ? 'up' : 'down';
    const trendPercent = ((currentPrice.price - previousPrice) / previousPrice * 100).toFixed(1);
    
    // UI Updates
    updateElement('current-price', currentPrice.price.toFixed(2));
    updateElement('price-chf', `${(currentPrice.price * EUR_TO_CHF / 1000).toFixed(4)} CHF/kWh`);
    updateElement('current-time', formatTime(currentPrice.date));
    
    // Trend
    const trendEl = document.querySelector('.price-trend');
    if (trendEl) {
        trendEl.className = `price-trend ${trend}`;
        trendEl.querySelector('span').textContent = `${trend === 'up' ? '+' : ''}${trendPercent}%`;
        trendEl.querySelector('svg path').setAttribute('d', 
            trend === 'up' ? 'M8 4l6 6H2l6-6z' : 'M8 12l6-6H2l6 6z'
        );
    }
    
    updateElement('min-price', minPrice.toFixed(2));
    updateElement('min-time', formatTime(data[minIndex].date));
    
    updateElement('max-price', maxPrice.toFixed(2));
    updateElement('max-time', formatTime(data[maxIndex].date));
    
    updateElement('avg-price', avgPrice.toFixed(2));
}

function updateElement(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

function formatTime(date) {
    return date.toLocaleTimeString('de-CH', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// ===== TIMELINE =====
function updateTimeline(data) {
    const timeline = document.getElementById('timeline');
    if (!timeline) return;
    
    timeline.innerHTML = '';
    
    const prices = data.map(d => d.price);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    // Zeige 24 Stunden
    data.forEach((point, index) => {
        const hour = point.date.getHours();
        const price = point.price;
        
        const item = document.createElement('div');
        item.className = 'timeline-item';
        
        // Klassifizierung
        if (hour === currentHour) {
            item.classList.add('active');
        } else if (price < avgPrice * 0.85) {
            item.classList.add('cheap');
        } else if (price > avgPrice * 1.15) {
            item.classList.add('expensive');
        }
        
        item.innerHTML = `
            <div class="timeline-time">${hour}:00</div>
            <div class="timeline-price">${price.toFixed(1)}</div>
            <div class="timeline-unit">€/MWh</div>
        `;
        
        item.addEventListener('click', () => {
            document.querySelectorAll('.timeline-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            updateElement('current-price', price.toFixed(2));
            updateElement('current-time', `${hour}:00`);
        });
        
        timeline.appendChild(item);
    });
    
    // Scroll to current hour
    const activeItem = timeline.querySelector('.timeline-item.active');
    if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

// ===== CHARTS =====
function updateCharts(data) {
    updateSparkline(data);
    updateMainChart(data);
}

function updateSparkline(data) {
    const canvas = document.getElementById('sparkline');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const padding = 0;
    
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;
    
    // Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0, 102, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 102, 255, 0)');
    
    // Area
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    
    data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((point.price - minPrice) / range) * (height - 2 * padding);
        
        if (index === 0) {
            ctx.lineTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Line
    ctx.beginPath();
    data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((point.price - minPrice) / range) * (height - 2 * padding);
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.strokeStyle = '#0066FF';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function updateMainChart(data) {
    const canvas = document.getElementById('mainChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 4; i++) {
        const y = padding + (i / 4) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Average line
    const avgY = height - padding - ((avgPrice - minPrice) / range) * chartHeight;
    ctx.strokeStyle = 'rgba(139, 147, 176, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding, avgY);
    ctx.lineTo(width - padding, avgY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Gradient
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(0, 102, 255, 0.2)');
    gradient.addColorStop(0.5, 'rgba(0, 102, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 102, 255, 0)');
    
    // Area
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    
    data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = height - padding - ((point.price - minPrice) / range) * chartHeight;
        ctx.lineTo(x, y);
    });
    
    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Line with segments
    data.forEach((point, index) => {
        if (index === 0) return;
        
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = height - padding - ((point.price - minPrice) / range) * chartHeight;
        const prevX = padding + ((index - 1) / (data.length - 1)) * chartWidth;
        const prevY = height - padding - ((data[index - 1].price - minPrice) / range) * chartHeight;
        
        // Color based on price
        if (point.price < avgPrice * 0.85) {
            ctx.strokeStyle = '#00D9A3'; // Cheap
        } else if (point.price > avgPrice * 1.15) {
            ctx.strokeStyle = '#FF3B5C'; // Expensive
        } else {
            ctx.strokeStyle = '#0066FF'; // Normal
        }
        
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
    });
    
    // Points
    data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = height - padding - ((point.price - minPrice) / range) * chartHeight;
        const hour = point.date.getHours();
        
        // Highlight current hour
        if (hour === currentHour) {
            ctx.fillStyle = '#0066FF';
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
    
    // Labels
    ctx.fillStyle = '#8B93B0';
    ctx.font = '12px "Space Mono", monospace';
    ctx.textAlign = 'center';
    
    // Time labels (every 4 hours)
    for (let i = 0; i < data.length; i += 4) {
        const x = padding + (i / (data.length - 1)) * chartWidth;
        const hour = data[i].date.getHours();
        ctx.fillText(`${hour}:00`, x, height - padding + 20);
    }
    
    // Price labels
    ctx.textAlign = 'right';
    ctx.fillText(`€${maxPrice.toFixed(0)}`, padding - 10, padding + 5);
    ctx.fillText(`€${minPrice.toFixed(0)}`, padding - 10, height - padding + 5);
    ctx.fillText(`€${avgPrice.toFixed(0)}`, padding - 10, avgY + 5);
}

// ===== UTILITIES =====
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }
}

function showToastMessage(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function updateLastUpdate() {
    const now = new Date();
    const timeString = now.toLocaleString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    updateElement('last-update', timeString);
}

// ===== RESPONSIVE CANVAS =====
window.addEventListener('resize', () => {
    if (priceData.length > 0) {
        updateCharts(priceData);
    }
});
