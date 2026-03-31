import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.mjs';

const PDF_URL = '/assets/guo-portfolio.pdf';
const book = document.getElementById('book');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const statusEl = document.getElementById('status');

let pages = [];
let currentIndex = 0;

function renderState() {
  pages.forEach((p, i) => {
    p.el.classList.toggle('flipped', i < currentIndex);
    p.el.style.zIndex = String(pages.length - i + (i < currentIndex ? 0 : 1000));
  });
  statusEl.textContent = `${Math.min(currentIndex + 1, pages.length)}/${pages.length}`;
  prevBtn.disabled = currentIndex <= 0;
  nextBtn.disabled = currentIndex >= pages.length;
}

function nextPage() {
  if (currentIndex < pages.length) { currentIndex += 1; renderState(); }
}

function prevPage() {
  if (currentIndex > 0) { currentIndex -= 1; renderState(); }
}

async function init() {
  try {
    statusEl.textContent = '正在读取PDF...';
    const doc = await pdfjsLib.getDocument(PDF_URL).promise;
    statusEl.textContent = `共 ${doc.numPages} 页，渲染中...`;

    for (let i = 1; i <= doc.numPages; i++) {
      const wrapper = document.createElement('article');
      wrapper.className = 'page';

      if (i === 1) {
        wrapper.classList.add('cover', 'custom-cover');
        wrapper.innerHTML = `
          <div class="custom-cover-inner">
            <div class="cover-side-title">郭子姝书法作品集</div>
            <div class="cover-main">书痕</div>
            <div class="cover-en">Guo Zishu · Calligraphy & Seal Engraving</div>
            <div class="cover-year">丙 午</div>
          </div>
        `;
      } else {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 1.4 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        if (i === doc.numPages) wrapper.classList.add('cover');
        wrapper.appendChild(canvas);
      }

      book.appendChild(wrapper);
      pages.push({ el: wrapper });
    }

    renderState();
  } catch (err) {
    console.error(err);
    statusEl.textContent = '加载失败，请确认PDF路径存在';
  }
}

nextBtn.addEventListener('click', nextPage);
prevBtn.addEventListener('click', prevPage);
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') nextPage();
  if (e.key === 'ArrowLeft') prevPage();
});

init();
