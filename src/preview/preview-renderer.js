import { byId, escapeHtml } from '../shared/dom.js';
import { store } from '../shared/store.js';

let zoom = 0.72;

export function renderPreview() {
  const { book, blocks } = store.getState();
  const pages = byId('preview-pages');

  pages.innerHTML = '';

  let paper = createPaper();
  pages.appendChild(paper);

  let flow = paper.querySelector('.paper-flow');
  flow.innerHTML = renderDocumentHeader(book);

  blocks.forEach(block => {
    const blockHtml = renderBlock(block);
    flow.insertAdjacentHTML('beforeend', blockHtml);

    if (flow.scrollHeight > flow.clientHeight) {
      flow.lastElementChild.remove();
      paper = createPaper();
      pages.appendChild(paper);
      flow = paper.querySelector('.paper-flow');
      flow.insertAdjacentHTML('beforeend', blockHtml);
    }
  });

  numberPages(pages);
  applyZoom();
}

function renderDocumentHeader(book) {
  const name = escapeHtml(book?.name || 'Novo livro');
  const source = escapeHtml(book?.sourceLanguage || '');
  const target = escapeHtml(book?.targetLanguage || '');

  return `
    <header class="document-header">
      <h1 class="document-title">${name}</h1>
      <div class="document-meta">${source} → ${target}</div>
    </header>
  `;
}

function renderBlock(block) {
  if (block.type === 'titulo') {
    const value = block.revisedTitle || block.automaticTitle || block.originalTitle;
    return section(block, `<h2>${escapeHtml(value)}</h2>`);
  }

  if (block.type === 'subtitulo') {
    const value = block.revisedSubtitle || block.automaticSubtitle || block.originalSubtitle;
    return section(block, `<h3>${escapeHtml(value)}</h3>`);
  }

  if (block.type === 'texto') {
    const value = block.revisedTranslation || block.automaticTranslation || block.originalText;
    return section(block, renderRichText(value));
  }

  return renderImageBlock(block);
}

function renderRichText(value) {
  const lines = String(value || '').split(/\r?\n/);
  const parts = [];
  let paragraph = [];
  let list = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    parts.push(`<p>${escapeHtml(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    parts.push(`<ul>${list.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`);
    list = [];
  };

  lines.forEach(rawLine => {
    const line = rawLine.trim();
    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);

    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
      return;
    }

    flushList();

    if (!line) {
      flushParagraph();
      return;
    }

    paragraph.push(line);
  });

  flushParagraph();
  flushList();

  return `<div class="document-text">${parts.join('')}</div>`;
}

function renderImageBlock(block) {
  const caption =
    block.revisedCaption ||
    block.automaticCaption ||
    block.originalCaption;

  const image = block.localImage
    ? `<img class="document-image" src="${block.localImage}" alt="">`
    : '';

  const captionHtml = caption
    ? `<p class="image-caption">${escapeHtml(caption)}</p>`
    : '';

  return section(block, `${image}${captionHtml}`);
}

function section(block, content) {
  return `
    <section class="document-block" data-preview-id="${block.blockId}">
      ${content}
    </section>
  `;
}

function createPaper() {
  const page = document.createElement('article');
  page.className = 'paper';
  page.innerHTML = `
    <div class="paper-flow"></div>
    <footer class="paper-footer">
      <span>Tradutor de Livros</span>
      <span class="page-number"></span>
    </footer>
  `;
  return page;
}

function numberPages(pages) {
  const allPages = [...pages.querySelectorAll('.paper')];
  allPages.forEach((page, index) => {
    page.querySelector('.page-number').textContent =
      `Página ${index + 1} de ${allPages.length}`;
  });
}

export function changeZoom(delta) {
  zoom = Math.max(0.35, Math.min(1.2, zoom + delta));
  applyZoom();
}

export function fitPreview() {
  zoom = Math.max(
    0.35,
    Math.min(1, (byId('preview-stage').clientWidth - 36) / 794)
  );
  applyZoom();
}

function applyZoom() {
  document.documentElement.style.setProperty('--zoom', zoom);
  byId('zoom-value').textContent = `${Math.round(zoom * 100)}%`;
}

export function printPdf() {
  renderPreview();
  window.print();
}
