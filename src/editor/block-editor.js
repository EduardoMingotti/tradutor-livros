import { escapeHtml, byId } from '../shared/dom.js';
import { store } from '../shared/store.js';
import { scheduleSave } from './autosave.js';
import { uploadImage } from './image-upload.js';
export function renderEditor() {
  const { blocks } = store.getState(); byId('blocks').innerHTML = blocks.map(renderBlock).join('');
  byId('blocks').querySelectorAll('[data-field]').forEach(element => element.addEventListener('input', onField));
  byId('blocks').querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => { store.moveBlock(button.dataset.id, Number(button.dataset.move)); scheduleSave(); }));
  byId('blocks').querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => { store.removeBlock(button.dataset.remove); scheduleSave(); }));
  byId('blocks').querySelectorAll('[data-file]').forEach(input => input.addEventListener('change', () => uploadImage(input.dataset.file, input.files[0])));
  wireDrops();
}
function onField(event) { store.updateBlock(event.target.dataset.id, { [event.target.dataset.field]:event.target.value }); scheduleSave(); }
function renderBlock(block) {
  const head=`<div class="block-card-header"><strong>${labels[block.type]}</strong><button class="button secondary small" data-id="${block.blockId}" data-move="-1">↑</button><button class="button secondary small" data-id="${block.blockId}" data-move="1">↓</button><button class="button secondary small danger" data-remove="${block.blockId}">Remover</button></div>`;
  return `<article class="block-card" data-block-id="${block.blockId}">${head}${fields(block)}</article>`;
}
function fields(b) {
  if (b.type==='titulo') return pair(b,'originalTitle','Título original','revisedTitle','Revisão opcional',b.automaticTitle);
  if (b.type==='subtitulo') return pair(b,'originalSubtitle','Subtítulo original','revisedSubtitle','Revisão opcional',b.automaticSubtitle);
  if (b.type==='texto') return pair(b,'originalText','Texto original','revisedTranslation','Revisão opcional',b.automaticTranslation,true);
  return `<div class="dropzone" data-drop="${b.blockId}"><strong>Arraste, clique ou cole uma imagem</strong><input type="file" accept="image/*" data-file="${b.blockId}"></div>${b.localImage?`<img class="image-thumb" src="${b.localImage}">`:''}${pair(b,'originalCaption','Legenda original','revisedCaption','Revisão opcional',b.automaticCaption)}`;
}
function pair(block, originalKey, originalLabel, reviewKey, reviewLabel, automatic, useTextarea = false) {
  const original = useTextarea
    ? `<textarea data-id="${block.blockId}" data-field="${originalKey}">${escapeHtml(block[originalKey])}</textarea>`
    : `<input data-id="${block.blockId}" data-field="${originalKey}" value="${escapeHtml(block[originalKey])}">`;
  const review = useTextarea
    ? `<textarea data-id="${block.blockId}" data-field="${reviewKey}">${escapeHtml(block[reviewKey])}</textarea>`
    : `<input data-id="${block.blockId}" data-field="${reviewKey}" value="${escapeHtml(block[reviewKey])}">`;
  const automaticResult = automatic
    ? `<div class="automatic"><strong>Automática:</strong> ${escapeHtml(automatic)}</div>`
    : '';
  return `<label>${originalLabel}${original}</label><label>${reviewLabel}${review}</label>${automaticResult}`;
}
function wireDrops() { byId('blocks').querySelectorAll('[data-drop]').forEach(zone=>{ zone.addEventListener('click',()=>zone.querySelector('input').click()); ['dragenter','dragover'].forEach(name=>zone.addEventListener(name,event=>{event.preventDefault();zone.classList.add('dragging')})); ['dragleave','drop'].forEach(name=>zone.addEventListener(name,event=>{event.preventDefault();zone.classList.remove('dragging')})); zone.addEventListener('drop',event=>uploadImage(zone.dataset.drop,event.dataTransfer.files[0])); }); }
const labels={titulo:'Título',subtitulo:'Subtítulo',texto:'Texto',imagem:'Imagem'};