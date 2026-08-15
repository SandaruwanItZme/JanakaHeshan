(() => {
  'use strict';

  // ---------------------------------------------------------------------
  // Core helpers
  // ---------------------------------------------------------------------
  const API = ''; // same-origin

  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }

  async function apiFetch(path, { method = 'GET', body } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (!['GET', 'HEAD'].includes(method)) {
      headers['X-CSRF-Token'] = getCookie('csrf_token');
    }
    const res = await fetch(API + path, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* no body */
    }
    if (!res.ok) {
      if (res.status === 401) showLogin();
      const error = new Error((data && data.error) || `Request failed (${res.status})`);
      error.status = res.status;
      throw error;
    }
    return data;
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else if (v !== false && v !== null && v !== undefined) node.setAttribute(k, v);
    }
    for (const child of [].concat(children)) {
      if (child === null || child === undefined) continue;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return node;
  }

  function toast(message, { type = 'info' } = {}) {
    const region = document.getElementById('toastRegion');
    const node = el('div', { class: `toast ${type === 'error' ? 'error' : ''}` }, message);
    region.appendChild(node);
    setTimeout(() => node.remove(), 4200);
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------------------------------------------------------------------
  // Modal + confirm
  // ---------------------------------------------------------------------
  function closeModal() {
    document.getElementById('modalRoot').innerHTML = '';
  }

  function openModal({ title, bodyNode, onSubmit, submitLabel = 'Save' }) {
    const root = document.getElementById('modalRoot');
    const form = el('form', { id: 'modalForm' });
    form.appendChild(bodyNode);
    const actions = el('div', { class: 'modal-actions' }, [
      el('button', { type: 'button', class: 'btn btn-ghost', onclick: closeModal }, 'Cancel'),
      el('button', { type: 'submit', class: 'btn btn-primary' }, submitLabel),
    ]);
    form.appendChild(actions);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await onSubmit(new FormData(form));
        closeModal();
      } catch (err) {
        toast(err.message, { type: 'error' });
      }
    });

    const modal = el('div', { class: 'modal' }, [
      el('div', { class: 'modal-head' }, [
        el('h3', {}, title),
        el('button', { type: 'button', class: 'modal-close', 'aria-label': 'Close', onclick: closeModal }, '✕'),
      ]),
      form,
    ]);
    root.innerHTML = '';
    root.appendChild(el('div', { class: 'modal-overlay', onclick: (e) => { if (e.target.classList.contains('modal-overlay')) closeModal(); } }, modal));
  }

  function confirmAction(message) {
    return new Promise((resolve) => {
      const body = el('p', { class: 'muted' }, message);
      openModal({
        title: 'Please confirm',
        bodyNode: body,
        submitLabel: 'Confirm',
        onSubmit: async () => resolve(true),
      });
      document.getElementById('modalRoot').addEventListener(
        'click',
        (e) => {
          if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal-overlay')) resolve(false);
        },
        { once: true }
      );
    });
  }

  // ---------------------------------------------------------------------
  // Field builder for forms
  // ---------------------------------------------------------------------
  function field({ name, label, type = 'text', value = '', full = false, options = null, checked = false }) {
    const wrap = el('label', { class: `field${full ? ' full' : ''}` });
    wrap.appendChild(el('span', {}, label));
    let input;
    if (type === 'textarea') {
      input = el('textarea', { name, rows: 4 });
      input.value = value || '';
    } else if (type === 'select') {
      input = el('select', { name });
      for (const opt of options) {
        const o = el('option', { value: opt.value }, opt.label);
        if (opt.value === value) o.selected = true;
        input.appendChild(o);
      }
    } else if (type === 'checkbox') {
      wrap.classList.remove('field');
      wrap.className = 'toggle-row';
      const label2 = el('span', {}, [el('span', { class: 'toggle-label' }, label)]);
      const sw = el('label', { class: 'switch' }, [
        (input = el('input', { type: 'checkbox', name })),
        el('span', { class: 'track' }, el('span', { class: 'thumb' })),
      ]);
      input.checked = Boolean(checked);
      wrap.innerHTML = '';
      wrap.appendChild(label2);
      wrap.appendChild(sw);
      return wrap;
    } else {
      input = el('input', { type, name });
      input.value = value ?? '';
    }
    wrap.appendChild(input);
    return wrap;
  }

  // ---------------------------------------------------------------------
  // Generic CRUD section (skills / projects / experience / education)
  // ---------------------------------------------------------------------
  function crudSection({ title, hint, apiPath, columns, fields, emptyText, toItem, fromForm }) {
    return async function render(container) {
      container.innerHTML = '';
      const block = el('div', { class: 'section-block' });
      const head = el('div', { class: 'section-head' }, [
        el('div', {}, [el('h3', {}, title), el('p', { class: 'muted' }, hint || '')]),
        el('button', { class: 'btn btn-primary', onclick: () => openForm(null) }, '+ Add new'),
      ]);
      block.appendChild(head);
      const tableWrap = el('div', { class: 'table-wrap' });
      block.appendChild(tableWrap);
      container.appendChild(block);
      tableWrap.innerHTML = `<table><tbody><tr><td><div class="skeleton" style="width:60%"></div></td></tr></tbody></table>`;

      let items = [];
      try {
        items = await apiFetch(apiPath);
      } catch (err) {
        tableWrap.innerHTML = '';
        tableWrap.appendChild(el('div', { class: 'empty-state' }, [el('strong', {}, 'Could not load data'), err.message]));
        return;
      }

      if (!items.length) {
        tableWrap.innerHTML = '';
        tableWrap.appendChild(el('div', { class: 'empty-state' }, [el('strong', {}, 'Nothing here yet'), emptyText || 'Add your first entry to get started.']));
        return;
      }

      const table = el('table');
      const thead = el('thead', {}, el('tr', {}, [...columns.map((c) => el('th', {}, c.label)), el('th', {}, 'Actions')]));
      const tbody = el('tbody');
      for (const item of items) {
        const tr = el('tr', {}, [
          ...columns.map((c) => el('td', {}, c.render ? c.render(item) : escapeHtml(item[c.key]))),
          el(
            'td',
            {},
            el('div', { class: 'row-actions' }, [
              el('button', { class: 'btn btn-ghost btn-sm', onclick: () => openForm(item) }, 'Edit'),
              el('button', { class: 'btn btn-danger btn-sm', onclick: () => onDelete(item) }, 'Delete'),
            ])
          ),
        ]);
        tbody.appendChild(tr);
      }
      table.appendChild(thead);
      table.appendChild(tbody);
      tableWrap.innerHTML = '';
      tableWrap.appendChild(table);

      function openForm(item) {
        const body = el('div', { class: 'form-grid' });
        for (const f of fields) {
          body.appendChild(
            field({
              name: f.name,
              label: f.label,
              type: f.type,
              full: f.full,
              options: f.options,
              value: item ? item[f.name] : f.default ?? '',
              checked: item ? Boolean(item[f.name]) : Boolean(f.default),
            })
          );
        }
        openModal({
          title: item ? `Edit ${title.replace(/s$/, '')}` : `Add ${title.replace(/s$/, '')}`,
          bodyNode: body,
          submitLabel: item ? 'Save changes' : 'Add',
          onSubmit: async (formData) => {
            const payload = fromForm ? fromForm(formData, fields) : Object.fromEntries(formData.entries());
            if (item) {
              await apiFetch(`${apiPath}/${item.id}`, { method: 'PUT', body: payload });
              toast('Saved changes.');
            } else {
              await apiFetch(apiPath, { method: 'POST', body: payload });
              toast('Added.');
            }
            render(container);
          },
        });
      }

      async function onDelete(item) {
        const ok = await confirmAction(`Delete "${item.title || item.name || item.company || item.institution || 'this entry'}"? This can't be undone.`);
        if (!ok) return;
        try {
          await apiFetch(`${apiPath}/${item.id}`, { method: 'DELETE' });
          toast('Deleted.');
          render(container);
        } catch (err) {
          toast(err.message, { type: 'error' });
        }
      }
    };
  }

  function defaultFromForm(formData, fields) {
    const out = {};
    for (const f of fields) {
      if (f.type === 'checkbox') out[f.name] = formData.get(f.name) === 'on';
      else if (f.type === 'number') out[f.name] = Number(formData.get(f.name) || 0);
      else if (f.array) out[f.name] = String(formData.get(f.name) || '').split(',').map((s) => s.trim()).filter(Boolean);
      else out[f.name] = formData.get(f.name) || '';
    }
    return out;
  }

  const skillsSection = crudSection({
    title: 'Skills',
    hint: 'Shown in the "Proficiency" section of the site.',
    apiPath: '/api/skills',
    emptyText: 'Add a skill to show your proficiency levels.',
    columns: [
      { key: 'name', label: 'Skill' },
      { key: 'category', label: 'Category' },
      { key: 'level', label: 'Level', render: (i) => `${i.level || 0}%` },
    ],
    fields: [
      { name: 'name', label: 'Skill name', type: 'text' },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'level', label: 'Level (0–100)', type: 'number' },
      { name: 'icon', label: 'Icon (optional keyword)', type: 'text' },
    ],
    fromForm: defaultFromForm,
  });

  const projectsSection = crudSection({
    title: 'Projects',
    hint: 'Shown in the "Things I\'ve shipped" section.',
    apiPath: '/api/projects',
    emptyText: 'Add a project to showcase your work.',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'featured', label: 'Featured', render: (i) => (i.featured ? '⭐ Yes' : 'No') },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      { name: 'image', label: 'Image URL', type: 'text' },
      { name: 'technologies', label: 'Technologies (comma-separated)', type: 'text', array: true, full: true },
      { name: 'githubUrl', label: 'GitHub URL', type: 'text' },
      { name: 'liveUrl', label: 'Live URL', type: 'text' },
      { name: 'featured', label: 'Featured project', type: 'checkbox', full: true },
    ],
    fromForm: (fd, fields) => {
      const out = defaultFromForm(fd, fields);
      if (typeof out.technologies === 'string') out.technologies = out.technologies.split(',').map((s) => s.trim()).filter(Boolean);
      return out;
    },
  });

  const experienceSection = crudSection({
    title: 'Experience',
    hint: 'Shown in the "How I got here" timeline.',
    apiPath: '/api/experience',
    emptyText: 'Add a role to build out your timeline.',
    columns: [
      { key: 'position', label: 'Position' },
      { key: 'company', label: 'Company' },
      { key: 'current', label: 'Current', render: (i) => (i.current ? 'Yes' : 'No') },
    ],
    fields: [
      { name: 'position', label: 'Position', type: 'text' },
      { name: 'company', label: 'Company', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      { name: 'startDate', label: 'Start date', type: 'date' },
      { name: 'endDate', label: 'End date', type: 'date' },
      { name: 'current', label: 'This is my current position', type: 'checkbox', full: true },
    ],
    fromForm: defaultFromForm,
  });

  const educationSection = crudSection({
    title: 'Education',
    hint: 'Courses, certifications, or formal education.',
    apiPath: '/api/education',
    emptyText: 'Add a course or qualification.',
    columns: [
      { key: 'course', label: 'Course' },
      { key: 'institution', label: 'Institution' },
    ],
    fields: [
      { name: 'course', label: 'Course / qualification', type: 'text' },
      { name: 'institution', label: 'Institution', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      { name: 'startDate', label: 'Start date', type: 'date' },
      { name: 'endDate', label: 'End date', type: 'date' },
    ],
    fromForm: defaultFromForm,
  });

  // ---------------------------------------------------------------------
  // Profile
  // ---------------------------------------------------------------------
  async function renderProfile(container) {
    container.innerHTML = '';
    const profile = await apiFetch('/api/profile');
    const block = el('div', { class: 'section-block' });
    block.appendChild(el('div', { class: 'section-head' }, el('h3', {}, 'Profile')));
    const form = el('form', { class: 'form-grid' });
    const map = [
      ['name', 'Name'], ['title', 'Title'], ['location', 'Location'], ['email', 'Email'],
      ['phone', 'Phone'], ['profileImage', 'Profile image URL'], ['resumeUrl', 'Resume URL'],
    ];
    for (const [name, label] of map) form.appendChild(field({ name, label, type: 'text', value: profile[name] }));
    form.appendChild(field({ name: 'description', label: 'Description', type: 'textarea', value: profile.description, full: true }));
    form.appendChild(field({ name: 'social_github', label: 'GitHub URL', value: profile.socialLinks?.github }));
    form.appendChild(field({ name: 'social_linkedin', label: 'LinkedIn URL', value: profile.socialLinks?.linkedin }));
    form.appendChild(field({ name: 'social_discord', label: 'Discord invite URL', value: profile.socialLinks?.discord }));
    const saveRow = el('div', { class: 'field full' }, el('button', { class: 'btn btn-primary', type: 'submit' }, 'Save profile'));
    form.appendChild(saveRow);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      payload.socialLinks = {
        github: payload.social_github || '', linkedin: payload.social_linkedin || '', discord: payload.social_discord || '',
      };
      delete payload.social_github; delete payload.social_linkedin; delete payload.social_discord;
      try {
        await apiFetch('/api/profile', { method: 'PUT', body: payload });
        toast('Profile saved.');
      } catch (err) {
        toast(err.message, { type: 'error' });
      }
    });
    block.appendChild(form);
    container.appendChild(block);
  }

  // ---------------------------------------------------------------------
  // Messages
  // ---------------------------------------------------------------------
  async function renderMessages(container) {
    container.innerHTML = '';
    const data = await apiFetch('/api/messages');
    updateMsgBadge(data.unread);

    const stats = el('div', { class: 'stat-grid' }, [
      statCard('Total', data.total), statCard('Unread', data.unread), statCard('Read', data.read),
    ]);
    container.appendChild(stats);

    const block = el('div', { class: 'section-block' });
    const search = el('input', { type: 'search', placeholder: 'Search messages…', style: 'max-width:240px' });
    const filterSel = el('select', {}, [
      el('option', { value: '' }, 'All statuses'),
      el('option', { value: 'NEW' }, 'New'), el('option', { value: 'READ' }, 'Read'),
      el('option', { value: 'REPLIED' }, 'Replied'), el('option', { value: 'ARCHIVED' }, 'Archived'),
    ]);
    block.appendChild(el('div', { class: 'section-head' }, [el('h3', {}, 'Inbox'), el('div', { class: 'row-actions' }, [search, filterSel])]));
    const tableWrap = el('div', { class: 'table-wrap' });
    block.appendChild(tableWrap);
    container.appendChild(block);

    function draw() {
      const q = search.value.toLowerCase();
      const status = filterSel.value;
      const items = data.items.filter(
        (m) => (!status || m.status === status) && (!q || `${m.name} ${m.email} ${m.message}`.toLowerCase().includes(q))
      );
      if (!items.length) {
        tableWrap.innerHTML = '';
        tableWrap.appendChild(el('div', { class: 'empty-state' }, [el('strong', {}, 'No messages'), 'Nothing matches right now.']));
        return;
      }
      const table = el('table');
      table.appendChild(el('thead', {}, el('tr', {}, ['Status', 'From', 'Message', 'Date', 'Actions'].map((h) => el('th', {}, h)))));
      const tbody = el('tbody');
      for (const m of items) {
        tbody.appendChild(
          el('tr', {}, [
            el('td', {}, el('span', { class: `pill pill-${m.status.toLowerCase()}` }, m.status)),
            el('td', {}, [el('div', {}, m.name), el('div', { class: 'muted' }, m.email)]),
            el('td', { style: 'max-width:280px' }, m.message.length > 80 ? m.message.slice(0, 80) + '…' : m.message),
            el('td', {}, fmtDate(m.createdAt)),
            el(
              'td',
              {},
              el('div', { class: 'row-actions' }, [
                el('button', { class: 'btn btn-ghost btn-sm', onclick: () => viewMessage(m) }, 'View'),
                el('button', { class: 'btn btn-danger btn-sm', onclick: () => removeMessage(m) }, 'Delete'),
              ])
            ),
          ])
        );
      }
      table.appendChild(tbody);
      tableWrap.innerHTML = '';
      tableWrap.appendChild(table);
    }
    search.addEventListener('input', draw);
    filterSel.addEventListener('change', draw);
    draw();

    function viewMessage(m) {
      const body = el('div', {}, [
        el('p', { class: 'muted' }, `${m.name} · ${m.email}${m.phone ? ' · ' + m.phone : ''}`),
        el('p', { style: 'margin-top:12px;white-space:pre-wrap' }, m.message),
        el('div', { class: 'form-grid', style: 'margin-top:18px' }, [
          field({ name: 'status', label: 'Status', type: 'select', value: m.status, full: true, options: [
            { value: 'NEW', label: 'New' }, { value: 'READ', label: 'Read' },
            { value: 'REPLIED', label: 'Replied' }, { value: 'ARCHIVED', label: 'Archived' },
          ] }),
        ]),
      ]);
      openModal({
        title: 'Message',
        bodyNode: body,
        submitLabel: 'Update status',
        onSubmit: async (fd) => {
          await apiFetch(`/api/messages/${m.id}`, { method: 'PATCH', body: { status: fd.get('status') } });
          toast('Status updated.');
          renderMessages(container);
        },
      });
    }

    async function removeMessage(m) {
      const ok = await confirmAction(`Delete the message from ${m.name}?`);
      if (!ok) return;
      await apiFetch(`/api/messages/${m.id}`, { method: 'DELETE' });
      toast('Deleted.');
      renderMessages(container);
    }
  }

  // ---------------------------------------------------------------------
  // Settings / Discord / Appearance
  // ---------------------------------------------------------------------
  async function renderSettings(container) {
    container.innerHTML = '';
    const s = await apiFetch('/api/settings');

    const general = el('div', { class: 'section-block' });
    general.appendChild(el('div', { class: 'section-head' }, el('h3', {}, 'General')));
    const gForm = el('form', { class: 'form-grid' });
    for (const [name, label] of [['siteTitle', 'Website title'], ['authorName', 'Author name'], ['contactEmail', 'Contact email'], ['contactPhone', 'Contact phone']]) {
      gForm.appendChild(field({ name, label, type: 'text', value: s[name] }));
    }
    gForm.appendChild(field({ name: 'siteDescription', label: 'Description', type: 'textarea', value: s.siteDescription, full: true }));
    gForm.appendChild(el('div', { class: 'field full' }, el('button', { class: 'btn btn-primary', type: 'submit' }, 'Save general settings')));
    gForm.addEventListener('submit', (e) => saveSettings(e, gForm));
    general.appendChild(gForm);

    const toggles = el('div', { class: 'section-block' });
    toggles.appendChild(el('div', { class: 'section-head' }, el('h3', {}, 'Website control')));
    const toggleDefs = [
      ['maintenanceMode', 'Maintenance mode', 'Show a maintenance page to visitors.'],
      ['contactFormEnabled', 'Contact form', 'Allow visitors to submit the contact form.'],
      ['discordNotificationsEnabled', 'Discord notifications', 'Send new messages to your Discord channel.'],
      ['analyticsEnabled', 'Analytics', 'Track anonymous visit data.'],
      ['showProjects', 'Show projects section', ''],
      ['showSocialLinks', 'Show social links', ''],
      ['showResumeButton', 'Show resume button', ''],
    ];
    for (const [name, label, desc] of toggleDefs) {
      const row = el('div', { class: 'toggle-row' }, [
        el('div', {}, [el('div', { class: 'toggle-label' }, label), desc ? el('div', { class: 'toggle-desc' }, desc) : null]),
      ]);
      const input = el('input', { type: 'checkbox' });
      input.checked = Boolean(s[name]);
      input.addEventListener('change', async () => {
        try {
          await apiFetch('/api/settings', { method: 'PUT', body: { [name]: input.checked } });
          toast('Setting updated.');
        } catch (err) {
          input.checked = !input.checked;
          toast(err.message, { type: 'error' });
        }
      });
      row.appendChild(el('label', { class: 'switch' }, [input, el('span', { class: 'track' }, el('span', { class: 'thumb' }))]));
      toggles.appendChild(row);
    }

    const discord = el('div', { class: 'section-block' });
    discord.appendChild(el('div', { class: 'section-head' }, [
      el('h3', {}, 'Discord'),
      el('span', { class: `pill ${s.discordConfigured ? 'pill-success' : 'pill-failure'}` }, s.discordConfigured ? 'Configured' : 'Not configured'),
    ]));
    discord.appendChild(el('p', { class: 'muted' }, 'The webhook URL lives only in the server\'s .env file and is never sent to this dashboard.'));
    const testBtn = el('button', { class: 'btn btn-primary', style: 'margin-top:12px' }, 'Test Discord webhook');
    testBtn.addEventListener('click', async () => {
      testBtn.disabled = true;
      testBtn.textContent = 'Sending…';
      try {
        await apiFetch('/api/discord/test', { method: 'POST' });
        toast('✅ Discord webhook connected successfully.');
      } catch (err) {
        toast('❌ Discord webhook failed. Check your configuration.', { type: 'error' });
      } finally {
        testBtn.disabled = false;
        testBtn.textContent = 'Test Discord webhook';
      }
    });
    discord.appendChild(testBtn);

    const security = el('div', { class: 'section-block' });
    security.appendChild(el('div', { class: 'section-head' }, el('h3', {}, 'Security')));
    const pForm = el('form', { class: 'form-grid' });
    pForm.appendChild(field({ name: 'currentPassword', label: 'Current password', type: 'password' }));
    pForm.appendChild(field({ name: 'newPassword', label: 'New password (min 10 characters)', type: 'password' }));
    pForm.appendChild(el('div', { class: 'field full' }, el('button', { class: 'btn btn-primary', type: 'submit' }, 'Change password')));
    pForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(pForm);
      try {
        await apiFetch('/api/auth/change-password', { method: 'POST', body: Object.fromEntries(fd.entries()) });
        toast('Password changed.');
        pForm.reset();
      } catch (err) {
        toast(err.message, { type: 'error' });
      }
    });
    security.appendChild(pForm);

    container.append(general, toggles, discord, security);

    async function saveSettings(e, form) {
      e.preventDefault();
      const fd = new FormData(form);
      try {
        await apiFetch('/api/settings', { method: 'PUT', body: Object.fromEntries(fd.entries()) });
        toast('Saved.');
      } catch (err) {
        toast(err.message, { type: 'error' });
      }
    }
  }

  async function renderAppearance(container) {
    container.innerHTML = '';
    const s = await apiFetch('/api/settings');
    const block = el('div', { class: 'section-block' });
    block.appendChild(el('div', { class: 'section-head' }, [el('h3', {}, 'Site theme'), el('p', { class: 'muted' }, 'Controls the public site\'s default appearance.')]));
    const form = el('form', { class: 'form-grid' });
    form.appendChild(field({ name: 'theme', label: 'Default mode', type: 'select', value: s.theme, options: [
      { value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }, { value: 'system', label: 'Match system' },
    ] }));
    form.appendChild(field({ name: 'animationIntensity', label: 'Animation intensity', type: 'select', value: s.animationIntensity, options: [
      { value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' },
    ] }));
    const accentWrap = el('label', { class: 'field' }, el('span', {}, 'Accent color'));
    const accentInput = el('input', { type: 'color', name: 'accentColor', value: s.accentColor || '#c77b3c' });
    accentWrap.appendChild(accentInput);
    form.appendChild(accentWrap);
    form.appendChild(el('div', { class: 'field full' }, el('button', { class: 'btn btn-primary', type: 'submit' }, 'Save appearance')));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      try {
        await apiFetch('/api/settings', { method: 'PUT', body: Object.fromEntries(fd.entries()) });
        toast('Appearance saved.');
      } catch (err) {
        toast(err.message, { type: 'error' });
      }
    });
    block.appendChild(form);
    container.appendChild(block);

    const local = el('div', { class: 'section-block' });
    local.appendChild(el('div', { class: 'section-head' }, [el('h3', {}, 'This dashboard'), el('p', { class: 'muted' }, 'Only affects how the control panel looks on this device.')]));
    local.appendChild(el('button', { class: 'btn btn-ghost', onclick: toggleAdminTheme }, 'Toggle dark / light'));
    container.appendChild(local);
  }

  // ---------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------
  function barList(title, items) {
    const max = Math.max(1, ...items.map((i) => i.value));
    const block = el('div', { class: 'section-block' });
    block.appendChild(el('div', { class: 'section-head' }, el('h3', {}, title)));
    if (!items.length) {
      block.appendChild(el('p', { class: 'muted' }, 'No data yet.'));
      return block;
    }
    const list = el('div');
    for (const i of items) {
      const row = el('div', { style: 'margin-bottom:10px' }, [
        el('div', { style: 'display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:4px' }, [
          el('span', {}, i.name || '(direct)'), el('span', { class: 'muted' }, String(i.value)),
        ]),
        el('div', { style: 'height:6px;border-radius:4px;background:var(--panel-3)' }, el('div', {
          style: `height:100%;border-radius:4px;background:var(--copper);width:${(i.value / max) * 100}%`,
        })),
      ]);
      list.appendChild(row);
    }
    block.appendChild(list);
    return block;
  }

  function statCard(label, value) {
    return el('div', { class: 'card' }, [el('div', { class: 'stat-label' }, label), el('div', { class: 'stat-value' }, String(value))]);
  }

  async function renderAnalytics(container) {
    container.innerHTML = '';
    const a = await apiFetch('/api/analytics/summary');
    container.appendChild(
      el('div', { class: 'stat-grid' }, [
        statCard('Total visits', a.totalVisitors), statCard("Today", a.today),
        statCard('This week', a.week), statCard('This month', a.month),
      ])
    );
    container.appendChild(barList('Popular pages', a.popularPages));
    container.appendChild(barList('Device types', a.devices));
    container.appendChild(barList('Browsers', a.browsers));
    container.appendChild(barList('Operating systems', a.operatingSystems));
    container.appendChild(barList('Referrers', a.referrers));
  }

  // ---------------------------------------------------------------------
  // Activity log
  // ---------------------------------------------------------------------
  async function renderActivity(container) {
    container.innerHTML = '';
    const items = await apiFetch('/api/activity');
    const block = el('div', { class: 'section-block' });
    block.appendChild(el('div', { class: 'section-head' }, el('h3', {}, 'Activity log')));
    if (!items.length) {
      block.appendChild(el('p', { class: 'muted' }, 'No activity recorded yet.'));
    } else {
      const table = el('table');
      table.appendChild(el('thead', {}, el('tr', {}, ['Action', 'User', 'IP', 'Result', 'Time'].map((h) => el('th', {}, h)))));
      const tbody = el('tbody');
      for (const i of items) {
        tbody.appendChild(
          el('tr', {}, [
            el('td', {}, i.action), el('td', {}, i.user), el('td', {}, i.ip || '—'),
            el('td', {}, el('span', { class: `pill ${i.result === 'success' ? 'pill-success' : 'pill-failure'}` }, i.result)),
            el('td', {}, fmtDate(i.createdAt)),
          ])
        );
      }
      table.appendChild(tbody);
      block.appendChild(el('div', { class: 'table-wrap' }, table));
    }
    container.appendChild(block);
  }

  // ---------------------------------------------------------------------
  // Overview
  // ---------------------------------------------------------------------
  async function renderOverview(container) {
    container.innerHTML = '';
    const [messages, analytics, projects, skills] = await Promise.all([
      apiFetch('/api/messages'), apiFetch('/api/analytics/summary'), apiFetch('/api/projects'), apiFetch('/api/skills'),
    ]);
    updateMsgBadge(messages.unread);
    container.appendChild(
      el('div', { class: 'stat-grid' }, [
        statCard('Unread messages', messages.unread), statCard("Visitors today", analytics.today),
        statCard('Projects', projects.length), statCard('Skills listed', skills.length),
      ])
    );
    const recent = el('div', { class: 'section-block' });
    recent.appendChild(el('div', { class: 'section-head' }, el('h3', {}, 'Recent messages')));
    const items = messages.items.slice(0, 5);
    if (!items.length) {
      recent.appendChild(el('p', { class: 'muted' }, 'No messages yet — they\'ll show up here as soon as someone reaches out.'));
    } else {
      for (const m of items) {
        recent.appendChild(
          el('div', { style: 'padding:10px 0;border-top:1px solid var(--border)' }, [
            el('div', { style: 'display:flex;justify-content:space-between' }, [
              el('strong', {}, m.name), el('span', { class: `pill pill-${m.status.toLowerCase()}` }, m.status),
            ]),
            el('div', { class: 'muted' }, m.message.length > 100 ? m.message.slice(0, 100) + '…' : m.message),
          ])
        );
      }
    }
    container.appendChild(recent);
  }

  // ---------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------
  function updateMsgBadge(n) {
    const badge = document.getElementById('navMsgBadge');
    if (n > 0) { badge.hidden = false; badge.textContent = n; } else { badge.hidden = true; }
  }

  async function pollNotifications() {
    try {
      const data = await apiFetch('/api/activity/notifications');
      const badge = document.getElementById('notifBadge');
      if (data.unread > 0) { badge.hidden = false; badge.textContent = data.unread; } else { badge.hidden = true; }
      const panel = document.getElementById('notifPanel');
      panel.innerHTML = '';
      if (!data.items.length) {
        panel.appendChild(el('div', { class: 'notif-item' }, 'No notifications yet.'));
      } else {
        for (const n of data.items.slice(0, 15)) {
          panel.appendChild(el('div', { class: 'notif-item' }, [n.title, el('small', {}, fmtDate(n.createdAt))]));
        }
      }
    } catch {
      /* not logged in yet, ignore */
    }
  }

  // ---------------------------------------------------------------------
  // Routing / shell
  // ---------------------------------------------------------------------
  const ROUTES = {
    overview: { title: 'Overview', render: renderOverview },
    profile: { title: 'Profile', render: renderProfile },
    projects: { title: 'Projects', render: projectsSection },
    skills: { title: 'Skills', render: skillsSection },
    experience: { title: 'Experience', render: experienceSection },
    education: { title: 'Education', render: educationSection },
    messages: { title: 'Messages', render: renderMessages },
    analytics: { title: 'Analytics', render: renderAnalytics },
    settings: { title: 'Settings', render: renderSettings },
    appearance: { title: 'Appearance', render: renderAppearance },
    activity: { title: 'Activity Log', render: renderActivity },
  };

  async function navigate(route) {
    if (!ROUTES[route]) route = 'overview';
    document.querySelectorAll('.nav-item[data-route]').forEach((btn) => btn.classList.toggle('active', btn.dataset.route === route));
    document.getElementById('pageTitle').textContent = ROUTES[route].title;
    document.getElementById('sidebar').classList.remove('open');
    const content = document.getElementById('content');
    content.innerHTML = '<div class="loading-bar"></div>';
    try {
      await ROUTES[route].render(content);
    } catch (err) {
      if (err.status !== 401) {
        content.innerHTML = '';
        content.appendChild(el('div', { class: 'empty-state' }, [el('strong', {}, 'Something went wrong'), err.message]));
      }
    }
  }

  function toggleAdminTheme() {
    const body = document.body;
    const next = body.dataset.theme === 'dark' ? 'light' : 'dark';
    body.dataset.theme = next;
    localStorage.setItem('admin-theme', next);
  }

  function showLogin() {
    document.getElementById('app').hidden = true;
    document.getElementById('loginScreen').hidden = false;
  }

  function showApp(username) {
    document.getElementById('loginScreen').hidden = true;
    document.getElementById('app').hidden = false;
    document.getElementById('whoami').textContent = username;
    navigate(location.hash.replace('#', '') || 'overview');
    pollNotifications();
    setInterval(pollNotifications, 30000);
  }

  function init() {
    const savedTheme = localStorage.getItem('admin-theme');
    if (savedTheme) document.body.dataset.theme = savedTheme;

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const errBox = document.getElementById('loginError');
      const btn = document.getElementById('loginSubmit');
      errBox.hidden = true;
      btn.disabled = true;
      btn.textContent = 'Signing in…';
      try {
        const data = await apiFetch('/api/auth/login', { method: 'POST', body: Object.fromEntries(fd.entries()) });
        showApp(data.username);
      } catch (err) {
        errBox.hidden = false;
        errBox.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Sign in';
      }
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      try { await apiFetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
      location.hash = '';
      showLogin();
    });

    document.getElementById('sidebarNav').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-route]');
      if (btn) location.hash = btn.dataset.route;
    });
    window.addEventListener('hashchange', () => navigate(location.hash.replace('#', '')));

    document.getElementById('sidebarToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
    document.getElementById('themeToggle').addEventListener('click', toggleAdminTheme);

    const notifBtn = document.getElementById('notifBtn');
    const notifPanel = document.getElementById('notifPanel');
    notifBtn.addEventListener('click', async () => {
      notifPanel.hidden = !notifPanel.hidden;
      if (!notifPanel.hidden) {
        try {
          await apiFetch('/api/activity/notifications/read-all', { method: 'POST' });
          document.getElementById('notifBadge').hidden = true;
        } catch { /* ignore */ }
      }
    });
    document.addEventListener('click', (e) => {
      if (!notifPanel.contains(e.target) && e.target !== notifBtn) notifPanel.hidden = true;
    });

    // Resolve session state on load.
    apiFetch('/api/auth/me')
      .then((data) => showApp(data.username))
      .catch(() => showLogin());
  }

  document.addEventListener('DOMContentLoaded', init);
})();
