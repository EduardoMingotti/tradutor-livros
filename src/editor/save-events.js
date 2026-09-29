import { saveNow } from './autosave.js';

let blurTimer = null;

export function initializeSaveEvents(editorPanel) {
  editorPanel.addEventListener('focusout', event => {
    if (!isEditableField(event.target)) return;

    window.clearTimeout(blurTimer);
    blurTimer = window.setTimeout(saveNow, 180);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveNow();
    }
  });
}

function isEditableField(element) {
  return element.matches('input, textarea, select');
}
