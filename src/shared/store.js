const state = {
  book: null,
  blocks: [],
  revision: 0
};

const listeners = new Set();

const automaticFieldByOriginalField = Object.freeze({
  originalTitle: 'automaticTitle',
  originalSubtitle: 'automaticSubtitle',
  originalText: 'automaticTranslation',
  originalCaption: 'automaticCaption'
});

export const store = {
  getState() {
    return state;
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  notify() {
    listeners.forEach(listener => listener(state));
  },

  setBook(book) {
    state.book = book;
    state.blocks = (book.blocks || []).map(block => ({ ...block }));
    state.revision = 0;
    this.notify();
  },

  addBlock(type) {
    state.blocks.push(createBlock(type));
    state.revision++;
    this.notify();
  },

  updateBlock(id, changes) {
    const block = state.blocks.find(item => item.blockId === id);
    if (!block) return;

    clearOutdatedTranslations_(block, changes);
    Object.assign(block, changes);

    state.revision++;
    this.notify();
  },

  removeBlock(id) {
    state.blocks = state.blocks.filter(item => item.blockId !== id);
    state.revision++;
    this.notify();
  },

  moveBlock(id, direction) {
    const index = state.blocks.findIndex(item => item.blockId === id);
    const target = index + direction;

    if (index < 0 || target < 0 || target >= state.blocks.length) return;

    [state.blocks[index], state.blocks[target]] = [
      state.blocks[target],
      state.blocks[index]
    ];

    state.revision++;
    this.notify();
  },

  markBookChanged() {
    state.revision++;
    clearAllAutomaticTranslations_();
  },

  mergeTranslations(serverBook) {
    const remoteById = new Map(
      (serverBook.blocks || []).map(block => [block.blockId, block])
    );

    state.blocks.forEach(localBlock => {
      const remoteBlock = remoteById.get(localBlock.blockId);
      if (!remoteBlock) return;

      mergeTranslationIfCurrent_(
        localBlock,
        remoteBlock,
        'originalTitle',
        'automaticTitle'
      );

      mergeTranslationIfCurrent_(
        localBlock,
        remoteBlock,
        'originalSubtitle',
        'automaticSubtitle'
      );

      mergeTranslationIfCurrent_(
        localBlock,
        remoteBlock,
        'originalText',
        'automaticTranslation'
      );

      mergeTranslationIfCurrent_(
        localBlock,
        remoteBlock,
        'originalCaption',
        'automaticCaption'
      );
    });

    this.notify();
  }
};

function clearOutdatedTranslations_(block, changes) {
  Object.keys(changes).forEach(field => {
    const automaticField = automaticFieldByOriginalField[field];
    if (!automaticField) return;

    if (changes[field] !== block[field]) {
      block[automaticField] = '';
    }
  });
}

function clearAllAutomaticTranslations_() {
  state.blocks.forEach(block => {
    block.automaticTitle = '';
    block.automaticSubtitle = '';
    block.automaticTranslation = '';
    block.automaticCaption = '';
  });
}

function mergeTranslationIfCurrent_(
  localBlock,
  remoteBlock,
  originalField,
  automaticField
) {
  const localOriginal = String(localBlock[originalField] || '');
  const remoteOriginal = String(remoteBlock[originalField] || '');

  if (localOriginal !== remoteOriginal) {
    return;
  }

  localBlock[automaticField] = remoteBlock[automaticField] || '';
}

function createBlock(type) {
  return {
    blockId: crypto.randomUUID(),
    type,
    originalTitle: '',
    automaticTitle: '',
    revisedTitle: '',
    originalSubtitle: '',
    automaticSubtitle: '',
    revisedSubtitle: '',
    originalText: '',
    automaticTranslation: '',
    revisedTranslation: '',
    originalCaption: '',
    automaticCaption: '',
    revisedCaption: '',
    imageFileId: '',
    imageName: '',
    imageMimeType: '',
    localImage: ''
  };
}
