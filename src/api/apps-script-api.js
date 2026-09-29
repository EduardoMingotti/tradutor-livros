import { CONFIG } from '../config.js';
async function parse(response) { const result = await response.json(); if (!result.success) throw new Error(result.error || 'Erro na API.'); return result.data; }
export async function get(action, parameters = {}) {
  const url = new URL(CONFIG.apiUrl); url.searchParams.set('action', action);
  Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, value));
  return parse(await fetch(url));
}
export async function post(action, payload = {}) {
  return parse(await fetch(CONFIG.apiUrl, { method:'POST', headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body:JSON.stringify({ action, ...payload }) }));
}
export const api = {
  listBooks: search => get('listBooks', { search }), getBook: bookId => get('getBook', { bookId }),
  createBook: data => post('createBook', data), updateBook: data => post('updateBook', data),
  saveBook: data => post('saveBook', data), saveProgress: data => post('saveProgress', data),
  uploadImage: data => post('uploadImage', data), getImage: fileId => get('getImage', { fileId }),
  deleteImage: fileId => post('deleteImage', { fileId })
};