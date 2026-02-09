# ⚡ Energie - Live Strompreise Schweiz

Eine moderne, intuitive Finanz-App für Live-Energiepreise in der Schweiz. 
Inspiriert von modernen Personal Finance Apps mit fokussiertem, minimalem Design.

![Version](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 📊 **Echtzeit-Daten**
- Live Day-Ahead Strompreise (Swissix Index)
- Automatische Aktualisierung alle 15 Minuten
- Preise in €/MWh und CHF/kWh

### 🎨 **Modernes Design**
- **Dark Theme** - Augenschonend, moderne Ästhetik
- **Glassmorphism** - Elegante, transparente Elemente
- **Smooth Animations** - Flüssige Übergänge und Micro-Interactions
- **Responsive** - Perfekt auf Mobile & Desktop

### 📈 **Visualisierung**
- **Interaktive Charts** - 24h Preisverlauf
- **Timeline** - Scrollbare Stundenansicht
- **Sparkline** - Mini-Chart in der Hero-Card
- **Farbcodierung** - Grün (günstig), Rot (teuer), Blau (normal)

### 💡 **Smart Insights**
- Beste Zeiten zum Energie-Laden
- Einsparungs-Potenzial
- Trend-Anzeige (+/- %)

### 🎯 **Intuitive UX**
- One-Tap Refresh
- Preisalarme (coming soon)
- Minimale Ladezeiten
- Keine Registrierung nötig

## 🚀 Quick Start

### Sofort im Browser öffnen
```bash
# Einfach index.html öffnen
open index.html
```

### Mit lokalem Server
```bash
# Python
python -m http.server 8000

# Node.js
npx serve

# Dann: http://localhost:8000
```

### Auf GitHub Pages deployen
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/[username]/energie-app.git
git push -u origin main

# GitHub Pages aktivieren in Settings
```

## 🎨 Design-Philosophie

### Inspiriert von

Diese App kombiniert die besten Elemente moderner Finanz-Apps:

- **Minimalistisches Interface** - Fokus auf das Wesentliche
- **Dunkles Theme** - Professionell und modern
- **Monospace Zahlen** - Klare Lesbarkeit bei Preisen
- **Subtile Animationen** - Delight ohne Ablenkung
- **Informations-Hierarchie** - Wichtiges zuerst

### Farbpalette

```css
Primary:   #0066FF  (Blau)
Success:   #00D9A3  (Grün)
Danger:    #FF3B5C  (Rot)
Background: #0A0E1A (Dunkelblau)
```

### Typografie

- **Display**: DM Sans (700) - Modern, gut lesbar
- **Mono**: Space Mono (400/700) - Für Zahlen und Preise

## 📁 Projekt-Struktur

```
energiepreise-modern/
├── index.html          # Haupt-HTML
├── style-modern.css    # Moderne Styles
├── app-modern.js       # JavaScript Logic
└── README.md           # Diese Datei
```

## 🔧 Technische Details

### API
- **Quelle**: Energy-Charts (Fraunhofer ISE)
- **Endpunkt**: `https://api.energy-charts.info/price?bzn=CH`
- **Format**: JSON
- **Kosten**: Kostenlos, keine API-Key nötig

### Browser Support
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Dependencies
**Keine!** - Reines Vanilla JavaScript, HTML & CSS

### Performance
- First Paint: < 100ms
- Bundle Size: < 50KB
- No external libraries

## 🎯 Roadmap

### v2.1 (Geplant)
- [ ] Preisalarme mit Push-Notifications
- [ ] Historische Daten (7 Tage / 30 Tage)
- [ ] Export als PDF/CSV
- [ ] PWA Support (Offline-Modus)

### v2.2 (Geplant)
- [ ] Vergleich mit anderen Ländern
- [ ] Prognose mit Machine Learning
- [ ] Dark/Light Theme Toggle
- [ ] Mehrsprachigkeit (DE/FR/IT/EN)

### v3.0 (Future)
- [ ] Integration mit Smart Home
- [ ] API für Drittanbieter
- [ ] Mobile Native Apps (React Native)

## 🎨 Customization

### Farben ändern

```css
/* In style-modern.css */
:root {
    --color-primary: #0066FF;  /* Deine Farbe */
    --color-success: #00D9A3;
    --color-danger: #FF3B5C;
}
```

### Fonts ändern

```html
<!-- In index.html -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
```

```css
/* In style-modern.css */
:root {
    --font-display: 'Inter', sans-serif;
}
```

### Update-Intervall

```javascript
// In app-modern.js
const UPDATE_INTERVAL = 30 * 60 * 1000; // 30 Minuten
```

## 📊 Screenshots

### Hero Card mit Live-Preis
![Hero](screenshot-hero.png)

### 24h Chart mit Timeline
![Chart](screenshot-chart.png)

### Mobile View
![Mobile](screenshot-mobile.png)

## 🤝 Contributing

Beiträge sind willkommen!

1. Fork das Projekt
2. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Pull Request öffnen

## 📝 Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei

## 🙏 Credits

- **Design Inspiration**: Personal Finance Apps (Revolut, N26, Wise)
- **Data Source**: [Energy-Charts](https://energy-charts.info) - Fraunhofer ISE
- **Fonts**: [Google Fonts](https://fonts.google.com)

## 💬 Kontakt

Fragen? Öffne ein [Issue](https://github.com/[username]/energie-app/issues)

---

**Made with ⚡ in Switzerland**
