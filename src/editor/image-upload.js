import { CONFIG } from '../config.js';
import { api } from '../api/apps-script-api.js';
import { store } from '../shared/store.js';
import { showToast } from '../shared/dom.js';
export async function uploadImage(blockId, file) {
  if (!file?.type.startsWith('image/')) return showToast('Selecione uma imagem válida.');
  const state = store.getState(); if (!state.book) return;
  try {
    const blob = await compress(file); const base64 = await toDataUrl(blob);
    store.updateBlock(blockId, { localImage:base64 });
    const result = await api.uploadImage({ bookId:state.book.bookId, blockId, fileName:safeName(file.name), mimeType:'image/webp', base64 });
    store.updateBlock(blockId, { imageFileId:result.fileId, imageName:result.fileName, imageMimeType:result.mimeType });
    showToast('Imagem salva no Drive.');
  } catch (error) { showToast(error.message); }
}
async function compress(file) { const url=URL.createObjectURL(file); const image=new Image(); await new Promise((resolve,reject)=>{ image.onload=resolve; image.onerror=reject; image.src=url; }); const ratio=Math.min(1,CONFIG.maxImageDimension/Math.max(image.width,image.height)); const canvas=document.createElement('canvas'); canvas.width=Math.round(image.width*ratio); canvas.height=Math.round(image.height*ratio); canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height); URL.revokeObjectURL(url); return new Promise(resolve=>canvas.toBlob(resolve,'image/webp',CONFIG.imageQuality)); }
function toDataUrl(blob) { return new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=reject; reader.readAsDataURL(blob); }); }
function safeName(name) { return `${String(name || 'captura').replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9 _-]/g,'-')}.webp`; }