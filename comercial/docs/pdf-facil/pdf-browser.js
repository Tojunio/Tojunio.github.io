/*
 * AJR COMERCIAL / AJR DOCS — PDF FÁCIL EM NAVEGADOR
 * Autor/responsável e titular reivindicado: Vitor Alexandre Júnior
 * © 2026 Vitor Alexandre Júnior. Direitos sobre contribuições originais.
 * Versão 0.8.2 — 14/11/2026. Código privado, sem cobrança real.
 * pdf-lib é componente de terceiros (licença própria). Não é registro INPI.
 */
import {executePdfOperation, validateInputFiles, PDF_LIMITS} from './pdf-browser-core.js';

const form = document.getElementById('pdf-browser-form');
const input = document.getElementById('pdf-browser-files');
const mode = document.getElementById('pdf-browser-mode');
const pages = document.getElementById('pdf-browser-pages');
const rotation = document.getElementById('pdf-browser-rotation');
const output = document.getElementById('pdf-browser-output');
const action = document.getElementById('pdf-browser-button');
const status = document.getElementById('pdf-browser-status');
const details = document.getElementById('pdf-browser-details');
let downloadUrl = null;
let loading = null;
const release = () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); downloadUrl = null; output.removeAttribute('href'); output.classList.add('hidden'); };

function refresh() {
  const chosenMode = mode.value;
  const chosenFiles = input.files?.length || 0;
  const ok = chosenMode === 'join' ? chosenFiles >= 2 && chosenFiles <= PDF_LIMITS.maxFiles : chosenFiles === 1;
  action.disabled = !ok;
  pages.disabled = chosenMode === 'join';
  rotation.disabled = chosenMode !== 'rotate';
  const labels = {
    join:'Reúne todas as páginas na ordem dos arquivos selecionados.',
    split:'Produz um PDF apenas com as páginas informadas (ex.: 2-4).',
    reorder:'Cria um PDF na ordem indicada (ex.: 3,1-2). Páginas omitidas são excluídas.',
    rotate:'Gira as páginas indicadas e mantém as demais sem alteração.'
  };
  details.textContent = labels[chosenMode] || '';
  release();
}
mode.addEventListener('change',refresh);
input.addEventListener('change',refresh);
pages.addEventListener('input',release);
rotation.addEventListener('change',release);

function loadEngine() {
  if (window.PDFLib?.PDFDocument) return Promise.resolve(window.PDFLib);
  if (!loading) {
    loading = new Promise((resolve,reject) => {
      const script = document.createElement('script');
      script.src = './vendor/pdf-lib.min.js'; // cópia local fixada pela instalação; sem CDN externo
      script.async = true;
      script.onload = () => window.PDFLib?.PDFDocument ? resolve(window.PDFLib) : reject(new Error('Biblioteca PDF incompatível.'));
      script.onerror = () => reject(new Error('Motor não instalado. Execute npm.cmd install na pasta do projeto.'));
      document.head.append(script);
    }).catch(e=>{loading=null;throw e;});
  }
  return loading;
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (action.disabled) return;
  release(); action.disabled = true;
  status.textContent = 'Processando PDFs somente neste navegador...';
  try {
    const files = validateInputFiles(input.files);
    const engine = await loadEngine();
    const result = await executePdfOperation({files,mode:mode.value,pages:pages.value,rotation:Number(rotation.value)},engine);
    const blob = new Blob([result.bytes],{type:'application/pdf'});
    downloadUrl = URL.createObjectURL(blob);
    output.href = downloadUrl;
    output.download = `AJR-PDF-Facil-${mode.value}-${result.pages}-paginas.pdf`;
    output.classList.remove('hidden');
    status.textContent = `${result.pages} página(s) pronta(s). Nenhum arquivo enviado ao servidor e nenhum crédito debitado.`;
  } catch(error) {
    status.textContent = error?.message || 'Não foi possível processar o arquivo.';
  } finally {refreshButton();}
});
function refreshButton(){
  const n = input.files?.length || 0;
  action.disabled = mode.value === 'join' ? n < 2 || n > PDF_LIMITS.maxFiles : n !== 1;
}
window.addEventListener('pagehide',release);
refresh();
