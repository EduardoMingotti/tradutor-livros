import { api } from './api/apps-script-api.js';
import { byId, setSaveState, showToast } from './shared/dom.js';
import { store } from './shared/store.js';
import { renderEditor } from './editor/block-editor.js';
import { scheduleSave, saveNow } from './editor/autosave.js';
import { initializeSaveEvents } from './editor/save-events.js';
import {
  renderPreview,
  changeZoom,
  fitPreview,
  printPdf
} from './preview/preview-renderer.js';
import {
  openLibrary,
  closeLibrary,
  loadLibrary
} from './library/library-drawer.js';

initializeApplication();

function initializeApplication() {
  subscribeToStore();
  initializeBookEvents();
  initializeLibraryEvents();
  initializeEditorEvents();
  initializePreviewEvents();
  initializePasteEvents();
  initializeSaveEvents(document.querySelector('.editor-panel'));
  registerServiceWorker();

  renderEditor();
  renderPreview();
}

function subscribeToStore() {
  store.subscribe(() => {
    renderEditor();
    renderPreview();
  });
}

function initializeBookEvents() {
  byId('new-book').addEventListener('click', () => {
    byId('new-book-dialog').showModal();
  });

  byId('new-book-form').addEventListener('submit', handleCreateBook);

  document.addEventListener('book:open', handleOpenBook);
}

async function handleCreateBook(event) {
  event.preventDefault();

  try {
    const book = await api.createBook({
      name: byId('new-book-name').value,
      sourceLanguage: byId('new-source').value,
      targetLanguage: byId('new-target').value
    });

    byId('new-book-dialog').close();
    loadBook(book);
  } catch (error) {
    showToast(error.message);
  }
}

async function handleOpenBook(event) {
  try {
    const book = await api.getBook(event.detail);
    loadBook(book);
    closeLibrary();
  } catch (error) {
    showToast(error.message);
  }
}

function initializeLibraryEvents() {
  byId('open-library').addEventListener('click', openLibrary);
  byId('close-library').addEventListener('click', closeLibrary);
  byId('library-search').addEventListener('input', loadLibrary);
}

function initializeEditorEvents() {
  document.querySelectorAll('[data-add]').forEach(button => {
    button.addEventListener('click', () => {
      store.addBlock(button.dataset.add);
      scheduleSave();
    });
  });

  byId('save-now').addEventListener('click', saveNow);

  [
    'book-name',
    'source-language',
    'target-language',
    'book-status'
  ].forEach(id => {
    byId(id).addEventListener('input', handleBookMetadataChange);
  });
}

function handleBookMetadataChange() {
  const state = store.getState();
  if (!state.book) return;

  state.book.name = byId('book-name').value;
  state.book.sourceLanguage = byId('source-language').value;
  state.book.targetLanguage = byId('target-language').value;
  state.book.status = byId('book-status').value;

  store.markBookChanged();
  store.notify();
  scheduleSave();
}

function initializePreviewEvents() {
  byId('zoom-out').addEventListener('click', () => changeZoom(-0.08));
  byId('zoom-in').addEventListener('click', () => changeZoom(0.08));
  byId('fit-preview').addEventListener('click', fitPreview);
  byId('download-pdf').addEventListener('click', printPdf);
}

function initializePasteEvents() {
  document.addEventListener('paste', handlePaste);
  document.addEventListener('image:paste', handleImagePaste);
}

function handlePaste(event) {
  const clipboardItems = [...(event.clipboardData?.items || [])];
  const imageItem = clipboardItems.find(item =>
    item.type.startsWith('image/')
  );

  const file = imageItem?.getAsFile();
  if (!file) return;

  let block = store
    .getState()
    .blocks
    .find(item => item.type === 'imagem' && !item.imageFileId);

  if (!block) {
    store.addBlock('imagem');
    block = store.getState().blocks.at(-1);
  }

  document.dispatchEvent(
    new CustomEvent('image:paste', {
      detail: {
        blockId: block.blockId,
        file
      }
    })
  );
}

async function handleImagePaste(event) {
  try {
    const { uploadImage } = await import('./editor/image-upload.js');
    await uploadImage(event.detail.blockId, event.detail.file);
  } catch (error) {
    showToast(error.message);
  }
}

function loadBook(book) {
  store.setBook(book);

  byId('book-name').value = book.name || '';
  byId('source-language').value = book.sourceLanguage || 'en';
  byId('target-language').value = book.targetLanguage || 'pt';
  byId('book-status').value = book.status || 'Em andamento';
  byId('current-book').textContent = book.name || 'Nenhum livro aberto';

  setSaveState('Pronto');
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('./sw.js').catch(error => {
    console.error('Falha ao registrar o service worker:', error);
  });
}
