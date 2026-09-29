const state = { book: null, blocks: [], revision: 0 };
const listeners = new Set();
export const store = {
  getState: () => state,
  subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  notify() { listeners.forEach(listener => listener(state)); },
  setBook(book) { state.book = book; state.blocks = (book.blocks || []).map(block => ({ ...block })); state.revision = 0; this.notify(); },
  addBlock(type) { state.blocks.push(createBlock(type)); state.revision++; this.notify(); },
  updateBlock(id, changes) { const block = state.blocks.find(item => item.blockId === id); if (!block) return; Object.assign(block, changes); state.revision++; this.notify(); },
  removeBlock(id) { state.blocks = state.blocks.filter(item => item.blockId !== id); state.revision++; this.notify(); },
  moveBlock(id, direction) { const index = state.blocks.findIndex(item => item.blockId === id); const target = index + direction; if (index < 0 || target < 0 || target >= state.blocks.length) return; [state.blocks[index], state.blocks[target]] = [state.blocks[target], state.blocks[index]]; state.revision++; this.notify(); },
  markBookChanged() { state.revision++; },
  mergeTranslations(serverBook) {
    const remoteById = new Map((serverBook.blocks || []).map(block => [block.blockId, block]));
    state.blocks.forEach(local => {
      const remote = remoteById.get(local.blockId); if (!remote) return;
      Object.assign(local, {
        automaticTitle: remote.automaticTitle || '', automaticSubtitle: remote.automaticSubtitle || '',
        automaticTranslation: remote.automaticTranslation || '', automaticCaption: remote.automaticCaption || ''
      });
    });
    this.notify();
  }
};
function createBlock(type) {
  return { blockId: crypto.randomUUID(), type, originalTitle:'', automaticTitle:'', revisedTitle:'', originalSubtitle:'', automaticSubtitle:'', revisedSubtitle:'', originalText:'', automaticTranslation:'', revisedTranslation:'', originalCaption:'', automaticCaption:'', revisedCaption:'', imageFileId:'', imageName:'', imageMimeType:'', localImage:'' };
}