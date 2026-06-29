/* ============================================================
   Chronicle – script.js
   Vanilla JS · ES6+ · LocalStorage persistence
   ============================================================ */

// ----- Strict mode & IIFE to avoid globals -----
(() => {
  'use strict';

  // ============================================================
  //  STATE
  // ============================================================
  const state = {
    timelines: [],           // [{ id, name, description, icon, createdAt, updatedAt }]
    events: [],              // [{ id, timelineId, dateDisplay, dateSort, title, description, categoryId, color, createdAt, updatedAt }]
    categories: [],          // [{ id, name, color }]
    settings: {
      theme: 'dark',         // 'dark' | 'light'
      lastTimelineId: null,  // string or null
    },
    currentTimelineId: null, // ID of the open timeline
    viewMode: 'timeline',    // 'timeline' | 'list'
    searchQuery: '',
    editingEventId: null,    // when editing, store event id
  };

  // ============================================================
  //  UTILITY FUNCTIONS
  // ============================================================
  const uid = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 6);

  // Deep clone
  const clone = (obj) => JSON.parse(JSON.stringify(obj));

  // Date parsing: supports "2025", "March 2025", "15 August 1947"
  function parseDateToSort(dateStr) {
    if (!dateStr) return 0;
    const trimmed = dateStr.trim();
    // Try full date: "15 August 1947" or "August 15, 1947" etc.
    let d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d.getTime();

    // Try "Month Year" (e.g., "March 2025")
    const monthYear = trimmed.match(/^([a-zA-Z]+)\s+(\d{4})$/);
    if (monthYear) {
      const monthIndex = new Date(Date.parse(monthYear[1] + ' 1, 2000')).getMonth();
      if (!isNaN(monthIndex)) {
        return new Date(parseInt(monthYear[2]), monthIndex, 1).getTime();
      }
    }

    // Try just year
    const year = trimmed.match(/^(\d{4})$/);
    if (year) {
      return new Date(parseInt(year[1]), 0, 1).getTime();
    }

    // fallback: try again with Date
    d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d.getTime();

    // If all fail, return 0
    return 0;
  }

  // Format date for display (could be the same as input)
  function formatDateDisplay(dateStr) {
    return dateStr || 'Unknown date';
  }

  // Get category by id
  function getCategory(id) {
    return state.categories.find(c => c.id === id) || null;
  }

  // Get category color for event
  function getEventColor(event) {
    if (event.categoryId) {
      const cat = getCategory(event.categoryId);
      if (cat) return cat.color;
    }
    return event.color || '#94a3b8'; // default gray
  }

  // Get events for a timeline, sorted by dateSort
  function getSortedEvents(timelineId) {
    const evs = state.events.filter(e => e.timelineId === timelineId);
    return evs.sort((a, b) => a.dateSort - b.dateSort);
  }

  // ============================================================
  //  STORAGE (LocalStorage)
  // ============================================================
  const STORAGE_KEY = 'chronicle_data';

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      state.timelines = data.timelines || [];
      state.events = data.events || [];
      state.categories = data.categories || [];
      state.settings = data.settings || { theme: 'dark', lastTimelineId: null };
      // Ensure settings fields
      if (!state.settings.theme) state.settings.theme = 'dark';
      // Apply theme
      document.documentElement.setAttribute('data-theme', state.settings.theme);
      updateThemeButton();
    } catch (e) {
      console.warn('Failed to load data:', e);
    }
  }

  function saveData() {
    const data = {
      timelines: state.timelines,
      events: state.events,
      categories: state.categories,
      settings: state.settings,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // ============================================================
  //  THEME
  // ============================================================
  function toggleTheme() {
    const newTheme = state.settings.theme === 'dark' ? 'light' : 'dark';
    state.settings.theme = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    updateThemeButton();
    saveData();
  }

  function updateThemeButton() {
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.textContent = state.settings.theme === 'dark' ? '🌙' : '☀️';
    }
  }

  // ============================================================
  //  MODAL
  // ============================================================
  const modalOverlay = document.getElementById('modalOverlay');
  const modalBox = document.getElementById('modalBox');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');

  function showModal(html) {
    modalBody.innerHTML = html;
    modalOverlay.classList.remove('hidden');
    // Focus management
    const firstInput = modalBox.querySelector('input, select, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
  }

  function hideModal() {
    modalOverlay.classList.add('hidden');
    modalBody.innerHTML = '';
  }

  // Close on overlay click or escape
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) hideModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideModal();
  });
  modalClose.addEventListener('click', hideModal);

  // ============================================================
  //  RENDER DASHBOARD
  // ============================================================
  function renderDashboard() {
    const grid = document.getElementById('timelineGrid');
    const countEl = document.getElementById('timelineCount');
    const emptyState = document.getElementById('emptyDashboard');

    countEl.textContent = `${state.timelines.length} timelines`;

    if (state.timelines.length === 0) {
      grid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    let html = '';
    state.timelines.forEach(tl => {
      const eventCount = state.events.filter(e => e.timelineId === tl.id).length;
      const created = new Date(tl.createdAt).toLocaleDateString();
      const updated = new Date(tl.updatedAt).toLocaleDateString();
      html += `
        <div class="timeline-card" data-id="${tl.id}">
          <div class="timeline-card-header">
            <span class="timeline-card-icon">${tl.icon || '📄'}</span>
            <span class="timeline-card-name">${escapeHtml(tl.name)}</span>
          </div>
          <div class="timeline-card-meta">
            <span>📅 ${eventCount} events</span>
            <span>🕒 ${created}</span>
            <span>✏️ ${updated}</span>
          </div>
          <div class="timeline-card-actions">
            <button class="btn btn-primary open-tl" data-id="${tl.id}">Open</button>
            <button class="btn btn-secondary rename-tl" data-id="${tl.id}">Rename</button>
            <button class="btn btn-danger delete-tl" data-id="${tl.id}">Delete</button>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html;

    // Attach event listeners
    grid.querySelectorAll('.open-tl').forEach(btn => {
      btn.addEventListener('click', () => openTimeline(btn.dataset.id));
    });
    grid.querySelectorAll('.rename-tl').forEach(btn => {
      btn.addEventListener('click', () => promptRenameTimeline(btn.dataset.id));
    });
    grid.querySelectorAll('.delete-tl').forEach(btn => {
      btn.addEventListener('click', () => confirmDeleteTimeline(btn.dataset.id));
    });
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================================
  //  TIMELINE CRUD
  // ============================================================
  function createTimeline(name, description, icon) {
    const tl = {
      id: uid(),
      name: name.trim() || 'Untitled',
      description: description ? description.trim() : '',
      icon: icon || '📄',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    state.timelines.push(tl);
    saveData();
    renderDashboard();
    return tl;
  }

  function renameTimeline(id, newName) {
    const tl = state.timelines.find(t => t.id === id);
    if (!tl) return;
    tl.name = newName.trim() || 'Untitled';
    tl.updatedAt = Date.now();
    saveData();
    renderDashboard();
    if (state.currentTimelineId === id) {
      updateTimelineViewHeader();
    }
  }

  function deleteTimeline(id) {
    state.timelines = state.timelines.filter(t => t.id !== id);
    state.events = state.events.filter(e => e.timelineId !== id);
    if (state.currentTimelineId === id) {
      state.currentTimelineId = null;
      state.settings.lastTimelineId = null;
      showDashboard();
    }
    saveData();
    renderDashboard();
  }

  function confirmDeleteTimeline(id) {
    const tl = state.timelines.find(t => t.id === id);
    if (!tl) return;
    showModal(`
      <h2>Delete Timeline</h2>
      <p>Are you sure you want to delete "<strong>${escapeHtml(tl.name)}</strong>" and all its events? This action cannot be undone.</p>
      <div class="form-actions">
        <button class="btn btn-secondary" id="modalCancel">Cancel</button>
        <button class="btn btn-danger" id="modalConfirm">Delete</button>
      </div>
    `);
    document.getElementById('modalCancel').addEventListener('click', hideModal);
    document.getElementById('modalConfirm').addEventListener('click', () => {
      deleteTimeline(id);
      hideModal();
    });
  }

  function promptRenameTimeline(id) {
    const tl = state.timelines.find(t => t.id === id);
    if (!tl) return;
    showModal(`
      <h2>Rename Timeline</h2>
      <div class="form-group">
        <label for="renameInput">New name</label>
        <input type="text" id="renameInput" value="${escapeHtml(tl.name)}" />
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" id="modalCancel">Cancel</button>
        <button class="btn btn-primary" id="modalConfirm">Save</button>
      </div>
    `);
    const input = document.getElementById('renameInput');
    input.focus();
    input.select();
    document.getElementById('modalCancel').addEventListener('click', hideModal);
    document.getElementById('modalConfirm').addEventListener('click', () => {
      const val = input.value.trim();
      if (val) {
        renameTimeline(id, val);
        hideModal();
      } else {
        input.focus();
      }
    });
  }

  // ============================================================
  //  NAVIGATION
  // ============================================================
  function showDashboard() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('dashboard').classList.add('active');
    renderDashboard();
    // Reset current timeline
    state.currentTimelineId = null;
    state.settings.lastTimelineId = null;
    saveData();
  }

  function openTimeline(id) {
    const tl = state.timelines.find(t => t.id === id);
    if (!tl) return;
    state.currentTimelineId = id;
    state.settings.lastTimelineId = id;
    saveData();
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('timelineView').classList.add('active');
    renderTimelineView();
  }

  // ============================================================
  //  RENDER TIMELINE VIEW
  // ============================================================
  function renderTimelineView() {
    const tl = state.timelines.find(t => t.id === state.currentTimelineId);
    if (!tl) {
      showDashboard();
      return;
    }

    // Header
    document.getElementById('timelineViewTitle').textContent = tl.name;
    document.getElementById('timelineViewIcon').textContent = tl.icon || '📄';
    document.getElementById('timelineViewDesc').textContent = tl.description || '';

    // Stats
    updateStats();

    // Set view mode buttons
    document.querySelectorAll('.btn-switch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === state.viewMode);
    });

    // Search
    document.getElementById('searchInput').value = state.searchQuery || '';

    // Render events
    renderEvents();

    // Update empty state
    const events = getSortedEvents(state.currentTimelineId);
    const filtered = filterEvents(events);
    const emptyEvents = document.getElementById('emptyEvents');
    const display = document.getElementById('timelineDisplay');
    if (filtered.length === 0) {
      display.innerHTML = '';
      emptyEvents.style.display = 'block';
      // Update empty event button
      document.getElementById('emptyEventBtn').onclick = () => showAddEventModal();
    } else {
      emptyEvents.style.display = 'none';
    }
  }

  function updateTimelineViewHeader() {
    const tl = state.timelines.find(t => t.id === state.currentTimelineId);
    if (!tl) return;
    document.getElementById('timelineViewTitle').textContent = tl.name;
    document.getElementById('timelineViewIcon').textContent = tl.icon || '📄';
    document.getElementById('timelineViewDesc').textContent = tl.description || '';
  }

  function updateStats() {
    const events = getSortedEvents(state.currentTimelineId);
    const total = events.length;
    document.getElementById('statEvents').textContent = total;

    if (total === 0) {
      document.getElementById('statOldest').textContent = '—';
      document.getElementById('statNewest').textContent = '—';
      document.getElementById('statCategories').textContent = '0';
      document.getElementById('statEdited').textContent = '—';
      return;
    }

    const oldest = events[0];
    const newest = events[events.length - 1];
    document.getElementById('statOldest').textContent = formatDateDisplay(oldest.dateDisplay);
    document.getElementById('statNewest').textContent = formatDateDisplay(newest.dateDisplay);

    // Unique categories
    const catIds = new Set(events.map(e => e.categoryId).filter(id => id));
    document.getElementById('statCategories').textContent = catIds.size;

    // Last edited (based on events updatedAt)
    const lastEdit = events.reduce((max, e) => Math.max(max, e.updatedAt || e.createdAt), 0);
    if (lastEdit) {
      document.getElementById('statEdited').textContent = new Date(lastEdit).toLocaleDateString();
    } else {
      document.getElementById('statEdited').textContent = '—';
    }
  }

  // ============================================================
  //  FILTER EVENTS (search)
  // ============================================================
  function filterEvents(events) {
    const query = state.searchQuery.trim().toLowerCase();
    if (!query) return events;
    return events.filter(e => {
      const title = (e.title || '').toLowerCase();
      const desc = (e.description || '').toLowerCase();
      const date = (e.dateDisplay || '').toLowerCase();
      const cat = getCategory(e.categoryId);
      const catName = cat ? cat.name.toLowerCase() : '';
      return title.includes(query) || desc.includes(query) || date.includes(query) || catName.includes(query);
    });
  }

  // ============================================================
  //  RENDER EVENTS (timeline or list)
  // ============================================================
  function renderEvents() {
    const events = getSortedEvents(state.currentTimelineId);
    const filtered = filterEvents(events);
    const display = document.getElementById('timelineDisplay');
    const emptyEvents = document.getElementById('emptyEvents');

    if (filtered.length === 0) {
      display.innerHTML = '';
      emptyEvents.style.display = 'block';
      return;
    }
    emptyEvents.style.display = 'none';

    if (state.viewMode === 'timeline') {
      renderTimelineMode(filtered, display);
    } else {
      renderListMode(filtered, display);
    }
  }

  function renderTimelineMode(events, container) {
    let html = '<div class="timeline-vertical">';
    events.forEach(event => {
      const cat = getCategory(event.categoryId);
      const catColor = getEventColor(event);
      const categoryName = cat ? cat.name : (event.categoryId ? 'Uncategorized' : '');
      const fullDesc = event.description || '';
      const preview = fullDesc.length > 120 ? fullDesc.substring(0, 120) + '…' : fullDesc;

      html += `
        <div class="timeline-event-node" data-id="${event.id}">
          <div class="event-card" data-id="${event.id}">
            <div class="event-card-header">
              <span class="event-date">${escapeHtml(event.dateDisplay || '')}</span>
              <span class="event-title">${escapeHtml(event.title || 'Untitled')}</span>
              ${categoryName ? `<span class="event-category-badge" style="background:${catColor}; color:#fff;">${escapeHtml(categoryName)}</span>` : ''}
            </div>
            <div class="event-description" data-full="${escapeHtml(fullDesc)}">
              ${escapeHtml(preview)}
            </div>
            <div class="event-card-actions">
              <button class="btn btn-secondary edit-event" data-id="${event.id}">✏️ Edit</button>
              <button class="btn btn-danger delete-event" data-id="${event.id}">🗑</button>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;

    // Toggle description expansion on click
    container.querySelectorAll('.event-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Ignore if click on button
        if (e.target.closest('button')) return;
        const desc = card.querySelector('.event-description');
        if (desc) {
          desc.classList.toggle('expanded');
          if (desc.classList.contains('expanded')) {
            desc.textContent = desc.dataset.full;
          } else {
            const full = desc.dataset.full;
            const preview = full.length > 120 ? full.substring(0, 120) + '…' : full;
            desc.textContent = preview;
          }
        }
      });
    });

    // Attach edit/delete listeners
    container.querySelectorAll('.edit-event').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showEditEventModal(btn.dataset.id);
      });
    });
    container.querySelectorAll('.delete-event').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmDeleteEvent(btn.dataset.id);
      });
    });
  }

  function renderListMode(events, container) {
    let html = `
      <table class="event-list">
        <thead>
          <tr>
            <th>Date</th>
            <th>Title</th>
            <th>Description</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;
    events.forEach(event => {
      const cat = getCategory(event.categoryId);
      const catColor = getEventColor(event);
      const categoryName = cat ? cat.name : (event.categoryId ? 'Uncategorized' : '');
      html += `
        <tr data-id="${event.id}">
          <td>${escapeHtml(event.dateDisplay || '')}</td>
          <td><strong>${escapeHtml(event.title || 'Untitled')}</strong></td>
          <td>${escapeHtml((event.description || '').substring(0, 60))}</td>
          <td>
            ${categoryName ? `<span class="category-dot" style="background:${catColor};"></span> ${escapeHtml(categoryName)}` : ''}
          </td>
          <td class="list-actions">
            <button class="btn btn-secondary edit-event" data-id="${event.id}">✏️</button>
            <button class="btn btn-danger delete-event" data-id="${event.id}">🗑</button>
          </td>
        </tr>
      `;
    });
    html += '</tbody></table>';
    container.innerHTML = html;

    container.querySelectorAll('.edit-event').forEach(btn => {
      btn.addEventListener('click', () => showEditEventModal(btn.dataset.id));
    });
    container.querySelectorAll('.delete-event').forEach(btn => {
      btn.addEventListener('click', () => confirmDeleteEvent(btn.dataset.id));
    });
  }

  // ============================================================
  //  EVENT CRUD
  // ============================================================
  function addEvent(timelineId, dateDisplay, title, description, categoryId, color) {
    const dateSort = parseDateToSort(dateDisplay);
    const event = {
      id: uid(),
      timelineId,
      dateDisplay: dateDisplay.trim() || 'Unknown',
      dateSort,
      title: title.trim() || 'Untitled',
      description: description ? description.trim() : '',
      categoryId: categoryId || null,
      color: color || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    state.events.push(event);
    saveData();
    renderTimelineView();
    return event;
  }

  function updateEvent(eventId, dateDisplay, title, description, categoryId, color) {
    const event = state.events.find(e => e.id === eventId);
    if (!event) return;
    event.dateDisplay = dateDisplay.trim() || 'Unknown';
    event.dateSort = parseDateToSort(event.dateDisplay);
    event.title = title.trim() || 'Untitled';
    event.description = description ? description.trim() : '';
    event.categoryId = categoryId || null;
    event.color = color || null;
    event.updatedAt = Date.now();
    saveData();
    renderTimelineView();
  }

  function deleteEvent(eventId) {
    state.events = state.events.filter(e => e.id !== eventId);
    saveData();
    renderTimelineView();
  }

  function confirmDeleteEvent(eventId) {
    const event = state.events.find(e => e.id === eventId);
    if (!event) return;
    showModal(`
      <h2>Delete Event</h2>
      <p>Are you sure you want to delete "<strong>${escapeHtml(event.title)}</strong>"?</p>
      <div class="form-actions">
        <button class="btn btn-secondary" id="modalCancel">Cancel</button>
        <button class="btn btn-danger" id="modalConfirm">Delete</button>
      </div>
    `);
    document.getElementById('modalCancel').addEventListener('click', hideModal);
    document.getElementById('modalConfirm').addEventListener('click', () => {
      deleteEvent(eventId);
      hideModal();
    });
  }

  // ============================================================
  //  EVENT MODAL (Add / Edit)
  // ============================================================
  function showAddEventModal() {
    state.editingEventId = null;
    renderEventModal(null);
  }

  function showEditEventModal(eventId) {
    state.editingEventId = eventId;
    renderEventModal(eventId);
  }

  function renderEventModal(eventId) {
    const event = eventId ? state.events.find(e => e.id === eventId) : null;
    const isEdit = !!event;

    // Build category dropdown with an option to add new category
    let catOptions = '<option value="">None</option>';
    state.categories.forEach(cat => {
      const selected = (event && event.categoryId === cat.id) ? 'selected' : '';
      catOptions += `<option value="${cat.id}" ${selected} style="background:${cat.color}; color:#fff;">${escapeHtml(cat.name)}</option>`;
    });

    const modalHtml = `
      <h2>${isEdit ? 'Edit Event' : 'Add Event'}</h2>
      <form id="eventForm">
        <div class="form-group">
          <label for="eventDate">Date</label>
          <input type="text" id="eventDate" placeholder="e.g., 15 August 1947, March 2025, 2025" value="${isEdit ? escapeHtml(event.dateDisplay) : ''}" required />
        </div>
        <div class="form-group">
          <label for="eventTitle">Title</label>
          <input type="text" id="eventTitle" placeholder="Event title" value="${isEdit ? escapeHtml(event.title) : ''}" required />
        </div>
        <div class="form-group">
          <label for="eventDesc">Description</label>
          <textarea id="eventDesc" placeholder="Full description…">${isEdit ? escapeHtml(event.description) : ''}</textarea>
        </div>
        <div class="form-group">
          <label for="eventCategory">Category</label>
          <div style="display:flex; gap:0.5rem;">
            <select id="eventCategory" style="flex:1;">
              ${catOptions}
            </select>
            <button type="button" id="addCategoryBtn" class="btn btn-secondary" title="Add new category">+</button>
          </div>
        </div>
        <div class="form-group">
          <label for="eventColor">Color (optional override)</label>
          <input type="color" id="eventColor" value="${isEdit && event.color ? event.color : '#6366f1'}" />
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" id="modalCancel">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Event</button>
        </div>
      </form>
    `;

    showModal(modalHtml);

    const form = document.getElementById('eventForm');
    const dateInput = document.getElementById('eventDate');
    const titleInput = document.getElementById('eventTitle');
    const descInput = document.getElementById('eventDesc');
    const catSelect = document.getElementById('eventCategory');
    const colorInput = document.getElementById('eventColor');
    const addCatBtn = document.getElementById('addCategoryBtn');

    // Add category button
    addCatBtn.addEventListener('click', () => {
      showAddCategoryModal((newCatId) => {
        // Refresh dropdown
        const currentVal = catSelect.value;
        let opts = '<option value="">None</option>';
        state.categories.forEach(cat => {
          const selected = (cat.id === newCatId) ? 'selected' : '';
          opts += `<option value="${cat.id}" ${selected} style="background:${cat.color}; color:#fff;">${escapeHtml(cat.name)}</option>`;
        });
        catSelect.innerHTML = opts;
        if (newCatId) catSelect.value = newCatId;
      });
    });

    // Cancel
    document.getElementById('modalCancel').addEventListener('click', hideModal);

    // Submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const date = dateInput.value.trim();
      const title = titleInput.value.trim();
      const desc = descInput.value.trim();
      const catId = catSelect.value || null;
      const color = colorInput.value || null;

      if (!date) {
        dateInput.focus();
        return;
      }
      if (!title) {
        titleInput.focus();
        return;
      }

      if (isEdit) {
        updateEvent(eventId, date, title, desc, catId, color);
      } else {
        addEvent(state.currentTimelineId, date, title, desc, catId, color);
      }
      hideModal();
    });
  }

  // ============================================================
  //  CATEGORY MANAGEMENT
  // ============================================================
  function showAddCategoryModal(callback) {
    showModal(`
      <h2>Add Category</h2>
      <form id="categoryForm">
        <div class="form-group">
          <label for="catName">Category Name</label>
          <input type="text" id="catName" placeholder="e.g., Personal" required />
        </div>
        <div class="form-group">
          <label for="catColor">Color</label>
          <input type="color" id="catColor" value="#6366f1" />
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" id="modalCancel">Cancel</button>
          <button type="submit" class="btn btn-primary">Add</button>
        </div>
      </form>
    `);

    const form = document.getElementById('categoryForm');
    const nameInput = document.getElementById('catName');
    const colorInput = document.getElementById('catColor');

    document.getElementById('modalCancel').addEventListener('click', hideModal);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      if (!name) return;
      const color = colorInput.value || '#6366f1';
      const newCat = {
        id: uid(),
        name,
        color,
      };
      state.categories.push(newCat);
      saveData();
      hideModal();
      if (callback) callback(newCat.id);
    });
  }

  // ============================================================
  //  VIEW SWITCHER
  // ============================================================
  function setViewMode(mode) {
    state.viewMode = mode;
    document.querySelectorAll('.btn-switch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === mode);
    });
    renderEvents();
  }

  // ============================================================
  //  SEARCH
  // ============================================================
  function updateSearch(query) {
    state.searchQuery = query;
    renderEvents();
  }

  // ============================================================
  //  EXPORT / IMPORT
  // ============================================================
  function exportTimeline() {
    const tl = state.timelines.find(t => t.id === state.currentTimelineId);
    if (!tl) return;
    const events = state.events.filter(e => e.timelineId === tl.id);
    const data = {
      timeline: tl,
      events: events,
      categories: state.categories, // include all categories for reference
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronicle-${tl.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importTimeline() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          // Validate
          if (!data.timeline || !data.events || !Array.isArray(data.events)) {
            alert('Invalid file format.');
            return;
          }
          // Check if timeline with same ID exists, we can create a new one with new ID
          const newTl = {
            ...data.timeline,
            id: uid(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          // Remove any existing timeline with same name? We'll just add new.
          state.timelines.push(newTl);
          // Import events, reassign timelineId
          data.events.forEach(ev => {
            const newEv = {
              ...ev,
              id: uid(),
              timelineId: newTl.id,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            state.events.push(newEv);
          });
          // Merge categories (optional)
          if (data.categories && Array.isArray(data.categories)) {
            data.categories.forEach(cat => {
              if (!state.categories.some(c => c.name === cat.name)) {
                state.categories.push({ ...cat, id: uid() });
              }
            });
          }
          saveData();
          renderDashboard();
          alert('Timeline imported successfully!');
        } catch (err) {
          alert('Failed to parse file: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // ============================================================
  //  EVENT BINDING & INIT
  // ============================================================
  function init() {
    loadData();

    // Show dashboard or last opened
    if (state.settings.lastTimelineId && state.timelines.some(t => t.id === state.settings.lastTimelineId)) {
      openTimeline(state.settings.lastTimelineId);
    } else {
      showDashboard();
    }

    // ---- Top bar ----
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // ---- Dashboard ----
    document.getElementById('createTimelineBtn').addEventListener('click', showCreateTimelineModal);
    document.getElementById('emptyCreateBtn').addEventListener('click', showCreateTimelineModal);

    // ---- Timeline view ----
    document.getElementById('backToDashboard').addEventListener('click', showDashboard);
    document.getElementById('exportTimelineBtn').addEventListener('click', exportTimeline);
    document.getElementById('importTimelineBtn').addEventListener('click', importTimeline);
    document.getElementById('deleteTimelineBtn').addEventListener('click', () => {
      if (state.currentTimelineId) {
        confirmDeleteTimeline(state.currentTimelineId);
      }
    });

    // View switcher
    document.getElementById('viewTimelineBtn').addEventListener('click', () => setViewMode('timeline'));
    document.getElementById('viewListBtn').addEventListener('click', () => setViewMode('list'));

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
      updateSearch(e.target.value);
    });

    // Add event
    document.getElementById('addEventBtn').addEventListener('click', showAddEventModal);
  }

  // ---- Create Timeline Modal ----
  function showCreateTimelineModal() {
    showModal(`
      <h2>Create Timeline</h2>
      <form id="createTimelineForm">
        <div class="form-group">
          <label for="tlName">Name *</label>
          <input type="text" id="tlName" placeholder="My Life" required />
        </div>
        <div class="form-group">
          <label for="tlDesc">Description</label>
          <input type="text" id="tlDesc" placeholder="Optional description" />
        </div>
        <div class="form-group">
          <label for="tlIcon">Icon (emoji)</label>
          <input type="text" id="tlIcon" placeholder="📚" maxlength="2" style="width:60px;" />
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" id="modalCancel">Cancel</button>
          <button type="submit" class="btn btn-primary">Create</button>
        </div>
      </form>
    `);

    const form = document.getElementById('createTimelineForm');
    const nameInput = document.getElementById('tlName');
    const descInput = document.getElementById('tlDesc');
    const iconInput = document.getElementById('tlIcon');

    document.getElementById('modalCancel').addEventListener('click', hideModal);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      if (!name) {
        nameInput.focus();
        return;
      }
      const description = descInput.value.trim();
      const icon = iconInput.value.trim() || '📄';
      const tl = createTimeline(name, description, icon);
      hideModal();
      openTimeline(tl.id);
    });
  }

  // ---- Start ----
  document.addEventListener('DOMContentLoaded', init);

})();