export const byId = id => document.getElementById(id);
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[character]);
}
export function showToast(message) {
  const toast = byId('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  window.setTimeout(() => toast.classList.add('hidden'), 2600);
}
export function setSaveState(message) { byId('save-state').textContent = message; }