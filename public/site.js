async function loadProfile() {
  const res = await fetch('/api/profile');
  const p = await res.json();

  const set = (id, v) => (document.getElementById(id).textContent = v || '');
  set('name', p.name);
  set('title', p.title);
  set('tagline', p.tagline);
  set('about', p.about);
  set('specialty', p.specialty);
  set('city', p.city);
  set('phone', p.phone);
  set('email', p.email);

  const photo = document.getElementById('photo');
  photo.src = p.photo || '/default-avatar.svg';

  const skills = document.getElementById('skills');
  skills.innerHTML = (p.skills || []).map(s => `<span class="chip">${s}</span>`).join('');

  const edu = document.getElementById('education');
  edu.innerHTML = (p.education || []).map(e => `
    <div class="item">
      <div><strong>${e.school || ''}</strong> · ${e.major || ''}</div>
      <div class="meta">${e.period || ''}</div>
      <div>${e.detail || ''}</div>
    </div>
  `).join('');

  const projects = document.getElementById('projects');
  projects.innerHTML = (p.projects || []).map(pr => `
    <div class="item">
      <div><strong>${pr.name || ''}</strong></div>
      <div class="meta">${pr.period || ''}</div>
      <div>${pr.desc || ''}</div>
    </div>
  `).join('');

  const awards = document.getElementById('awards');
  awards.innerHTML = (p.awards || []).map(a => `<li style="margin-bottom:8px">${a}</li>`).join('');

  const trajectory = document.getElementById('trajectory');
  trajectory.textContent = p.trajectory || '';

  const gallery = document.getElementById('gallery');
  const items = Array.isArray(p.portfolioItems) && p.portfolioItems.length
    ? p.portfolioItems
    : [{ image: (p.portfolio && p.portfolio.image) ? p.portfolio.image : '/default-avatar.svg', title: p.portfolio?.title || '', desc: p.portfolio?.desc || '' }];

  gallery.innerHTML = items.map((it) => `
    <article class="gallery-item">
      <div class="gallery-image-box"><img src="${it.image}" alt="作品图"/></div>
      <h4>${it.title || '未命名作品'}</h4>
      <p>${it.desc || ''}</p>
    </article>
  `).join('');
}

loadProfile();
