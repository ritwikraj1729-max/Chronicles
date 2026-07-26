# Chronicles

**A single‑file web application for history students to organise events into structured, searchable timelines.**  
No backend, no dependencies — just open the HTML file and start chronicling.

---

## ✨ Features

- **Timeline management** – Create, edit, and delete timelines. Each timeline has a name, description, and a custom accent colour.
- **Four event types** – Events are categorised into:
  - **Time Periods** (start–end year)
  - **Exact Dates** (day, month, year)
  - **Month & Year** (month + year)
  - **Years** (single year)
- **Chrome‑style tab bar** – Switch between the four types with a single click. Each tab shows the number of events it contains.
- **Vertical timeline display** – Events inside a tab are shown as a connected, chronological timeline with date markers and importance stars (★ to ★★★).
- **Search** – Filter events by name or description across all tabs simultaneously.
- **Persistent storage** – All data is saved automatically in your browser’s `localStorage`. Close and reopen the page – your work is still there.
- **Responsive** – Works on desktop, tablet, and mobile.
- **Dark mode** – Premium dark interface inspired by GitHub Dark and Linear.
- **Accessible** – Semantic HTML, keyboard navigation, visible focus states, and high contrast.

---

## 🚀 Getting Started

1. **Download** the `index.html` file.
2. **Open** it in any modern browser (Chrome, Firefox, Edge, Safari, etc.).
3. Start creating timelines and adding events – no internet connection required.

---

## 📚 How to Use

### Dashboard
- Click **“Create Timeline”** to start a new timeline.
- Each timeline card shows its name, description (if any), and event count.
- Click a card to open it, or use the **⋮** menu to edit or delete.

### Timeline View
- The **tab bar** lets you switch between the four event types.
- Each tab displays only events of that type, sorted chronologically.
- Events are shown as a vertical timeline with:
  - A **date marker** (formatted appropriately for the type)
  - The **event name** and optional **description**
  - **Importance stars** (1–3)
  - **Edit** and **Delete** buttons (appear on hover)
- The **search bar** filters events by name or description across all tabs.

### Adding an Event
1. Click **“Add Event”**.
2. Choose the event type (Time Period, Exact Date, Month & Year, or Year).
3. Fill in the event name, description (optional), importance, and the specific date fields.
4. Click **“Add Event”** – it will appear in the correct tab, automatically sorted.

### Editing / Deleting
- **Timeline**: Use the ⋮ menu on the dashboard or timeline page to edit or delete the entire timeline.
- **Event**: Hover over an event and click the ✎ or 🗑 buttons.

---

## 🧰 Technology

- **HTML5** – Semantic markup
- **CSS3** – Custom properties, flexible layouts, animations
- **Vanilla JavaScript** – No frameworks, no libraries
- **localStorage** – Persistent client‑side storage

The entire application is contained in a single `index.html` file (CSS and JavaScript are embedded).

---

## 📁 File Structure

```
index.html      # Single file containing all HTML, CSS, and JavaScript
```

---

## 🎨 Design Notes

- **Dark mode** – Charcoal background, soft gray panels, subtle shadows.
- **Accent colour** – Calm blue used sparingly for emphasis.
- **Typography** – System fonts with a serif (`Iowan Old Style`) for dates and numerals to add period character.
- **Animations** – Smooth, tasteful, and non‑distracting (respects `prefers-reduced-motion`).

---

## 📱 Responsive

- Desktop – full layout with tab bar.
- Tablet – adjusted spacing and font sizes.
- Mobile – stacked layout, tabs shrink, timeline markers scale down.

---

## ♿ Accessibility

- All interactive elements are keyboard‑accessible.
- Focus indicators are visible (and only appear when using keyboard).
- Appropriate ARIA labels and roles.
- Good colour contrast throughout.

---

## 📦 Storage

Data is stored in the browser’s `localStorage` under the key `chronicles_data_v1`.  
No login, no server, no cloud – your data stays on your device.

---

## 🤝 Contributing

This is a self‑contained project. If you wish to contribute, feel free to fork and submit a pull request.  
For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

MIT – use it, modify it, share it.

---

**Made for history students, by a history enthusiast.**  
*Organise your past, one event at a time.*
