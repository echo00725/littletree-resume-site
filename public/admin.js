const $ = (id) => document.getElementById(id);
const msg = (t) => ($('msg').textContent = t);

function renderWorks(items = []) {
  const box = $('worksList');
  if (!box) return;
  box.innerHTML = (items || []).map((it, i) => `
    <div class="works-row">
      <img src="${it.image}" alt="作品${i + 1}" />
      <div class="works-fields">
        <input data-title-id="${it.id}" placeholder="作品名称" value="${(it.title || '').replace(/"/g, '&quot;')}" />
        <input data-desc-id="${it.id}" placeholder="作品说明（可选）" value="${(it.desc || '').replace(/"/g, '&quot;')}" />
      </div>
      <div class="works-actions">
        <button class="btn secondary" data-save-id="${it.id}">保存</button>
        <button class="btn" data-del-id="${it.id}">删除</button>
      </div>
    </div>
  `).join('') || '<div class="tip">暂无作品，请上传。</div>';

  box.querySelectorAll('[data-save-id]').forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-save-id');
      const title = box.querySelector(`[data-title-id="${id}"]`)?.value?.trim() || '';
      const desc = box.querySelector(`[data-desc-id="${id}"]`)?.value?.trim() || '';
      const res = await fetch('/api/update-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title, desc })
      });
      if (!res.ok) return msg('❌ 保存作品信息失败');
      const data = await res.json();
      renderWorks(data.items || []);
      msg('✅ 作品名称/说明已保存');
    };
  });

  box.querySelectorAll('[data-del-id]').forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-del-id');
      const res = await fetch('/api/delete-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) return msg('❌ 删除失败');
      const data = await res.json();
      renderWorks(data.items || []);
      msg('✅ 已删除作品');
    };
  });
}

async function init() {
  const res = await fetch('/api/profile');
  const p = await res.json();

  $('name').value = p.name || '';
  $('title').value = p.title || '';
  $('phone').value = p.phone || '';
  $('email').value = p.email || '';
  $('city').value = p.city || '';
  $('tagline').value = p.tagline || '';
  $('about').value = p.about || '';
  $('specialty').value = p.specialty || '';
  $('trajectory').value = p.trajectory || '';
  $('workTitle').value = (p.portfolio && p.portfolio.title) ? p.portfolio.title : '';
  $('workDesc').value = (p.portfolio && p.portfolio.desc) ? p.portfolio.desc : '';

  $('skills').value = (p.skills || []).join('\n');
  $('awards').value = (p.awards || []).join('\n');
  $('education').value = JSON.stringify(p.education || [], null, 2);
  $('projects').value = JSON.stringify(p.projects || [], null, 2);
  renderWorks(p.portfolioItems || []);
}

$('saveBtn').onclick = async () => {
  try {
    const payload = {
      name: $('name').value.trim(),
      title: $('title').value.trim(),
      phone: $('phone').value.trim(),
      email: $('email').value.trim(),
      city: $('city').value.trim(),
      tagline: $('tagline').value.trim(),
      about: $('about').value.trim(),
      specialty: $('specialty').value.trim(),
      trajectory: $('trajectory').value.trim(),
      portfolio: {
        title: $('workTitle').value.trim(),
        desc: $('workDesc').value.trim()
      },
      skills: $('skills').value.split('\n').map(s => s.trim()).filter(Boolean),
      awards: $('awards').value.split('\n').map(s => s.trim()).filter(Boolean),
      education: JSON.parse($('education').value || '[]'),
      projects: JSON.parse($('projects').value || '[]')
    };

    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('保存失败');
    msg('✅ 已保存成功！');
  } catch (e) {
    msg('❌ 保存失败，请检查 JSON 格式是否正确。');
  }
};

$('uploadBtn').onclick = async () => {
  const file = $('photoInput').files[0];
  if (!file) return msg('请先选择图片文件。');

  const fd = new FormData();
  fd.append('photo', file);

  const res = await fetch('/api/upload-photo', { method: 'POST', body: fd });
  if (!res.ok) return msg('❌ 上传失败');
  msg('✅ 照片上传成功，主页已自动使用新照片。');
};

$('uploadWorkBtn').onclick = async () => {
  const file = $('workInput').files[0];
  if (!file) return msg('请先选择作品图片。');

  const fd = new FormData();
  fd.append('work', file);

  const res = await fetch('/api/upload-work', { method: 'POST', body: fd });
  if (!res.ok) return msg('❌ 作品图上传失败');
  msg('✅ 作品图上传成功，前台代表作品已更新。');
};

$('uploadWorksBtn').onclick = async () => {
  const files = Array.from(($('worksInput').files || []));
  if (!files.length) return msg('请先选择多张作品图。');

  const fd = new FormData();
  files.forEach((f) => fd.append('works', f));

  const res = await fetch('/api/upload-works', { method: 'POST', body: fd });
  if (!res.ok) return msg('❌ 批量上传失败');
  const data = await res.json();
  renderWorks(data.items || []);
  msg(`✅ 已上传 ${files.length} 张作品图`);
};

init();
