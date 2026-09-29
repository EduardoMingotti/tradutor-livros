import { CONFIG } from '../config.js';
import { api } from '../api/apps-script-api.js';
import { byId, setSaveState, showToast } from '../shared/dom.js';
import { store } from '../shared/store.js';
let timer = null; let inFlight = false; let queued = false;
export function scheduleSave(delay = CONFIG.autosaveDelayMs) { if (!store.getState().book) return; clearTimeout(timer); setSaveState('Alterações pendentes'); timer = setTimeout(saveNow, delay); }
export async function saveNow() {
  const state = store.getState(); if (!state.book) return showToast('Crie ou abra um livro primeiro.');
  clearTimeout(timer); if (inFlight) { queued = true; return; }
  inFlight = true; queued = false; const revisionAtStart = state.revision; const snapshot = state.blocks.map(toPayload);
  setSaveState('Salvando...');
  try {
    await api.updateBook({ bookId:state.book.bookId, name:byId('book-name').value, sourceLanguage:byId('source-language').value, targetLanguage:byId('target-language').value, status:byId('book-status').value });
    const saved = await api.saveBook({ bookId:state.book.bookId, blocks:snapshot });
    store.mergeTranslations(saved);
    if (store.getState().revision === revisionAtStart && !queued) setSaveState('Salvo'); else scheduleSave(250);
    setTimeout(refreshTranslations, CONFIG.translationRefreshDelayMs);
  } catch (error) { setSaveState('Falha ao salvar'); showToast(error.message); }
  finally { inFlight = false; if (queued || store.getState().revision > revisionAtStart) { queued = false; scheduleSave(250); } }
}
async function refreshTranslations() { const state = store.getState(); if (!state.book || inFlight) return; try { store.mergeTranslations(await api.getBook(state.book.bookId)); } catch {} }
function toPayload(block, index) { return { blockId:block.blockId, order:index+1, type:block.type, originalTitle:block.originalTitle, revisedTitle:block.revisedTitle, originalSubtitle:block.originalSubtitle, revisedSubtitle:block.revisedSubtitle, originalText:block.originalText, revisedTranslation:block.revisedTranslation, originalCaption:block.originalCaption, revisedCaption:block.revisedCaption, imageFileId:block.imageFileId, imageName:block.imageName, imageMimeType:block.imageMimeType }; }