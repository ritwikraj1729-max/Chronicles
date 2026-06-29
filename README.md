# 📜 Chronicle – Timeline Management Web App

**Chronicle** is a fully offline, production‑quality web application for organizing personal histories, project roadmaps, historical timelines, and any sequence of events. It stores all data in your browser’s `localStorage`, so everything works without an internet connection or a backend server.

> **Live demo:** just open `index.html` in any modern browser – no build steps, no dependencies.

---

## ✨ Features

- **Unlimited timelines** – create as many as you need (e.g. *My Life*, *History of India*, *Company Journey*, *Programming Journey*).
- **Unlimited events per timeline** – automatically sorted chronologically (supports year‑only, month+year, and full dates).
- **Two viewing modes**:
  - **Vertical Timeline** – beautiful node‑based layout with expandable descriptions.
  - **List View** – clean table with sortable columns.
- **Live search** – instantly filter events by title, description, date, or category.
- **Statistics** – total events, oldest/newest event, category count, last edit date.
- **Categories** – create custom categories with colours; events inherit category colours.
- **Full CRUD** – create, rename, delete timelines; add, edit, delete events (with confirmation).
- **Export / Import** – backup or transfer a timeline (and its events) as a JSON file.
- **Theme** – dark mode (default) and light mode, stored persistently.
- **Responsive** – works on desktop, tablet, and mobile.
- **Accessible** – semantic HTML, ARIA labels, keyboard navigation, focus states.
- **Blazing fast** – optimised for hundreds or thousands of events.

---

## 🚀 Getting Started

1. Download the three files:
   - `index.html`
   - `style.css`
   - `script.js`
2. Place them in the same folder.
3. Open `index.html` in your browser.
4. That’s it – the app is ready to use.

All data is automatically saved to `localStorage` as you work.

---

## 📂 File Structure

| File | Description |
|------|-------------|
| `index.html` | Main HTML structure (semantic, accessible). |
| `style.css` | Complete styling with CSS variables, dark/light themes, responsive layouts. |
| `script.js` | Vanilla JavaScript (ES6+) – data management, UI rendering, event handling, `localStorage` persistence. |

No external libraries, frameworks, or build tools are used.

---

## 🧠 How It Works

- **Data Model**: timelines, events, categories, and settings are stored as plain JavaScript objects.
- **Sorting**: every event has a `dateSort` field (milliseconds since epoch) computed from the human‑readable `dateDisplay`. The app parses year‑only, month+year, and full dates automatically.
- **Persistence**: all changes are immediately written to `localStorage` under the key `chronicle_data`. The app restores your last opened timeline and theme on reload.
- **Rendering**: UI updates are DOM‑based, with efficient re‑rendering only when data changes.

---

## 🎨 Customisation

- **Themes**: toggle between dark and light using the ☀️/🌙 button in the top bar. Your preference is stored.
- **Accent colour**: defined in CSS variables (`--accent`). You can change it globally in `style.css` (default is Indigo `#6366f1`).
- **Icons**: choose any emoji for a timeline or event (e.g., 📚, 💼, 🌍).

---

## 📦 Data Export & Import

- **Export**: click the **Export** button on a timeline’s page – you’ll get a JSON file containing the timeline, all its events, and category references.
- **Import**: click **Import** and select a previously exported JSON file. The timeline will be added with a new ID, keeping your existing data intact.

---

## ♿ Accessibility

- All interactive elements are keyboard‑accessible.
- Focus indicators are clearly visible.
- ARIA roles and labels are used where appropriate.
- Colour contrast meets WCAG standards.

---

## 🛠️ Development Notes

- The entire app is contained in three files, making it easy to fork, modify, or embed.
- No external dependencies – ideal for air‑gapped or low‑bandwidth environments.
- To reset your data, clear `localStorage` via DevTools or use `localStorage.removeItem('chronicle_data')`.

---

## 📄 License

This project is open‑source and available under the [MIT License](LICENSE) (add a `LICENSE` file if you wish).

---

## 🙌 Acknowledgements

Built with pure HTML, CSS, and vanilla JavaScript – a testament to what’s possible without frameworks.

---

**Happy chronicling!** 🕰️
