// SkillSwap — Simple client-side JavaScript for student skill exchange
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Attach logout listener if present on page
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = async (e) => {
      e.preventDefault();
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login.html';
    };
  }

  // Check current session to identify user for interactive features
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        currentUser = data.data;
      }
    }
  } catch (e) {
    currentUser = null;
  }

  // Page 1: Browse Skills
  if (document.getElementById('skills-container')) {
    const container = document.getElementById('skills-container');
    const searchBox = document.getElementById('search-box');
    const catSelect = document.getElementById('category-select');
    const typeSelect = document.getElementById('type-select');

    async function fetchSkills() {
      const params = new URLSearchParams();
      if (searchBox && searchBox.value.trim()) params.set('search', searchBox.value.trim());
      if (catSelect && catSelect.value) params.set('category', catSelect.value);
      if (typeSelect && typeSelect.value) params.set('type', typeSelect.value);

      container.innerHTML = '<p>Loading skills...</p>';
      try {
        const res = await fetch('/api/skills?' + params.toString());
        const json = await res.json();
        const list = json.data || [];

        if (list.length === 0) {
          container.innerHTML = '<p>No skills found matching your filter.</p>';
          return;
        }

        container.innerHTML = list.map(s => {
          let btnHtml = '';
          if (currentUser && currentUser.userId === s.user_id) {
            btnHtml = '<span class="badge">Your Post</span>';
          } else if (currentUser) {
            btnHtml = `<button type="button" class="btn connect-btn" data-id="${s.id}">Connect / Learn</button>`;
          } else {
            btnHtml = '<a href="/login.html" class="btn btn-secondary">Log in to Connect</a>';
          }

          return `
            <article class="skill-card">
              <div class="meta">
                <span class="badge">${s.type === 'teach' ? 'Can Teach' : 'Wants to Learn'}</span>
                ${s.category ? `<span class="badge">${escapeHtml(s.category)}</span>` : ''}
                <span>By: <strong>${escapeHtml(s.user_name)}</strong></span>
                ${s.department ? `<span>(${escapeHtml(s.department)})</span>` : ''}
              </div>
              <h3>${escapeHtml(s.title)}</h3>
              <p>${escapeHtml(s.description || 'No description provided.')}</p>
              <div style="margin-top: 10px;">${btnHtml}</div>
            </article>
          `;
        }).join('');

        container.querySelectorAll('.connect-btn').forEach(btn => {
          btn.onclick = async () => {
            const skillId = btn.getAttribute('data-id');
            const msg = prompt('Enter a short message (optional):', 'Hi, I would like to learn / exchange skills with you.');
            if (msg === null) return; // user cancelled

            btn.disabled = true;
            btn.textContent = 'Sending...';
            try {
              const r = await fetch('/api/interests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skill_id: skillId, message: msg })
              });
              const d = await r.json();
              if (r.ok && d.success) {
                btn.textContent = 'Request Sent!';
              } else {
                alert(d.message || 'Could not send request.');
                btn.disabled = false;
                btn.textContent = 'Connect / Learn';
              }
            } catch (err) {
              alert('Error sending request.');
              btn.disabled = false;
              btn.textContent = 'Connect / Learn';
            }
          };
        });
      } catch (err) {
        container.innerHTML = '<p class="error-text">Failed to load skills.</p>';
      }
    }

    if (searchBox) searchBox.oninput = fetchSkills;
    if (catSelect) catSelect.onchange = fetchSkills;
    if (typeSelect) typeSelect.onchange = fetchSkills;
    fetchSkills();
  }

  // Page 2: Login & Registration
  if (document.getElementById('login-form')) {
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    const loginErr = document.getElementById('login-error');
    const regErr = document.getElementById('register-error');
    const authAlert = document.getElementById('auth-alert');

    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      loginErr.hidden = true;
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const d = await res.json();
        if (res.ok && d.success) {
          sessionStorage.setItem('isLoggedIn', 'true');
          window.location.href = '/dashboard.html';
        } else {
          loginErr.textContent = d.message || 'Login failed.';
          loginErr.hidden = false;
        }
      } catch (err) {
        loginErr.textContent = 'Connection error.';
        loginErr.hidden = false;
      }
    };

    regForm.onsubmit = async (e) => {
      e.preventDefault();
      regErr.hidden = true;
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const department = document.getElementById('reg-dept').value.trim();
      const bio = document.getElementById('reg-bio').value.trim();

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, department, bio })
        });
        const d = await res.json();
        if (res.ok && d.success) {
          authAlert.textContent = 'Account created successfully! Please log in above.';
          authAlert.hidden = false;
          regForm.reset();
        } else {
          regErr.textContent = d.message || 'Registration failed.';
          regErr.hidden = false;
        }
      } catch (err) {
        regErr.textContent = 'Connection error.';
        regErr.hidden = false;
      }
    };
  }

  // Page 3: Dashboard
  if (document.getElementById('post-skill-form')) {
    if (!currentUser) {
      window.location.href = '/login.html';
      return;
    }

    const postForm = document.getElementById('post-skill-form');
    const postErr = document.getElementById('skill-form-error');
    const mySkills = document.getElementById('my-skills-container');
    const incoming = document.getElementById('incoming-container');
    const outgoing = document.getElementById('outgoing-container');

    postForm.onsubmit = async (e) => {
      e.preventDefault();
      postErr.hidden = true;
      const type = postForm.querySelector('input[name="type"]:checked').value;
      const title = document.getElementById('skill-title').value.trim();
      const category = document.getElementById('skill-category').value;
      const description = document.getElementById('skill-description').value.trim();

      try {
        const res = await fetch('/api/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, title, category, description })
        });
        const d = await res.json();
        if (res.ok && d.success) {
          postForm.reset();
          loadDashboardData();
        } else {
          postErr.textContent = d.message || 'Could not post skill.';
          postErr.hidden = false;
        }
      } catch (err) {
        postErr.textContent = 'Server error.';
        postErr.hidden = false;
      }
    };

    async function loadDashboardData() {
      // 1. My Skills
      try {
        const r1 = await fetch('/api/skills/mine');
        const d1 = await r1.json();
        const skills = d1.data || [];
        mySkills.innerHTML = skills.length === 0
          ? '<p>You have not posted any skills yet.</p>'
          : skills.map(s => `
            <article class="skill-card">
              <div class="meta">
                <span class="badge">${s.type === 'teach' ? 'Teaching' : 'Learning'}</span>
                <span class="badge">${escapeHtml(s.category || 'General')}</span>
              </div>
              <h3>${escapeHtml(s.title)}</h3>
              <p>${escapeHtml(s.description || 'No description.')}</p>
              <div style="margin-top: 10px;">
                <button type="button" class="btn btn-danger delete-btn" data-id="${s.id}">Delete</button>
              </div>
            </article>
          `).join('');

        mySkills.querySelectorAll('.delete-btn').forEach(btn => {
          btn.onclick = async () => {
            if (confirm('Delete this skill?')) {
              await fetch('/api/skills/' + btn.getAttribute('data-id'), { method: 'DELETE' });
              loadDashboardData();
            }
          };
        });
      } catch (e) {
        mySkills.innerHTML = '<p class="error-text">Error loading skills.</p>';
      }

      // 2. Incoming Requests
      try {
        const r2 = await fetch('/api/interests/incoming');
        const d2 = await r2.json();
        const inc = d2.data || [];
        incoming.innerHTML = inc.length === 0
          ? '<p>No requests on your skills yet.</p>'
          : inc.map(item => `
            <article class="skill-card">
              <p><strong>${escapeHtml(item.sender_name)}</strong> wants to connect on: <strong>${escapeHtml(item.skill_title)}</strong></p>
              ${item.sender_department ? `<p><small>Dept: ${escapeHtml(item.sender_department)}</small></p>` : ''}
              ${item.message ? `<p>Message: <em>"${escapeHtml(item.message)}"</em></p>` : ''}
              <div style="margin-top: 10px;">
                ${item.status === 'pending' ? `
                  <button type="button" class="btn accept-btn" data-id="${item.id}">Accept</button>
                  <button type="button" class="btn btn-secondary decline-btn" data-id="${item.id}">Decline</button>
                ` : `
                  <span class="badge">Status: ${escapeHtml(item.status)}</span>
                  ${item.status === 'accepted' ? `<p style="margin-top: 5px; color: #155724;"><strong>Student Email:</strong> <a href="mailto:${escapeHtml(item.sender_email)}">${escapeHtml(item.sender_email)}</a></p>` : ''}
                `}
              </div>
            </article>
          `).join('');

        incoming.querySelectorAll('.accept-btn').forEach(btn => {
          btn.onclick = async () => {
            await fetch(`/api/interests/${btn.getAttribute('data-id')}/accept`, { method: 'PUT' });
            loadDashboardData();
          };
        });

        incoming.querySelectorAll('.decline-btn').forEach(btn => {
          btn.onclick = async () => {
            await fetch(`/api/interests/${btn.getAttribute('data-id')}/decline`, { method: 'PUT' });
            loadDashboardData();
          };
        });
      } catch (e) {
        incoming.innerHTML = '<p class="error-text">Error loading requests.</p>';
      }

      // 3. Outgoing Requests
      try {
        const r3 = await fetch('/api/interests/outgoing');
        const d3 = await r3.json();
        const out = d3.data || [];
        outgoing.innerHTML = out.length === 0
          ? '<p>You have not requested to connect with anyone yet.</p>'
          : out.map(item => `
            <article class="skill-card">
              <p>You requested to connect with <strong>${escapeHtml(item.recipient_name)}</strong> for: <strong>${escapeHtml(item.skill_title)}</strong></p>
              <p><span class="badge">Status: ${escapeHtml(item.status)}</span></p>
              ${item.status === 'accepted' ? `<p style="margin-top: 5px; color: #155724;"><strong>Student Email:</strong> <a href="mailto:${escapeHtml(item.recipient_email)}">${escapeHtml(item.recipient_email)}</a></p>` : ''}
            </article>
          `).join('');
      } catch (e) {
        outgoing.innerHTML = '<p class="error-text">Error loading outgoing requests.</p>';
      }
    }

    loadDashboardData();
  }
});

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
