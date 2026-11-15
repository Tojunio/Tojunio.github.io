/*
 * AJR COMERCIAL / AJR DOCS — PDF FÁCIL (CÓDIGO ORIGINAL DO PROJETO)
 * Autor/responsável e titular reivindicado: Vitor Alexandre Júnior
 * © 2026 Vitor Alexandre Júnior. Direitos sobre contribuições originais.
 * Versão: 0.8.2 | Registro de alteração: 14/11/2026
 * Uso privado. Biblioteca pdf-lib é de terceiros e mantém licença própria.
 * Esta declaração não é assinatura digital certificada nem registro no INPI.
 */

/** Opera PDFs externos SOMENTE no navegador; nunca usa APIs da AJR para os bytes. */
export const PDF_LIMITS = Object.freeze({ maxFiles: 3, maxFileBytes: 3 * 1024 * 1024, maxTotalBytes: 8 * 1024 * 1024, maxPages: 80 });
export const MODES = Object.freeze(['join', 'split', 'reorder', 'rotate']);

export function parsePageSelection(raw, pageCount, {allowAll = true} = {}) {
  if (!Number.isSafeInteger(pageCount) || pageCount < 1) throw new Error('Número de páginas inválido.');
  const spec = String(raw ?? '').trim().replace(/\s+/g, '');
  if (allowAll && (!spec || /^(todas|all)$/i.test(spec))) return Array.from({length: pageCount}, (_, i) => i);
  if (!spec || spec.length > 500) throw new Error('Informe páginas como 1,3-5,2.');
  const seen = new Set();
  const out = [];
  for (const token of spec.split(',')) {
    const match = /^(\d{1,4})(?:-(\d{1,4}))?$/.exec(token);
    if (!match) throw new Error('Intervalo inválido: use 1,3-5 ou 5-3.');
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    if (start < 1 || end < 1 || start > pageCount || end > pageCount)
      throw new Error(`A página precisa estar entre 1 e ${pageCount}.`);
    const step = start <= end ? 1 : -1;
    for (let i = start; ; i += step) {
      const index = i - 1;
      if (seen.has(index)) throw new Error('A mesma página foi indicada mais de uma vez.');
      seen.add(index); out.push(index);
      if (out.length > PDF_LIMITS.maxPages) throw new Error('Limite de 80 páginas por operação.');
      if (i === end) break;
    }
  }
  return out;
}

export function validateInputFiles(files) {
  const list = Array.from(files || []);
  if (!list.length || list.length > PDF_LIMITS.maxFiles) throw new Error('Escolha de 1 a 3 arquivos PDF.');
  let sum = 0;
  for (const file of list) {
    if (!file || !Number.isFinite(file.size) || file.size <= 0 || file.size > PDF_LIMITS.maxFileBytes)
      throw new Error('Cada PDF deve ter no máximo 3 MB.');
    if (typeof file.arrayBuffer !== 'function') throw new Error('Arquivo PDF inválido.');
    sum += file.size;
  }
  if (sum > PDF_LIMITS.maxTotalBytes) throw new Error('Total de arquivos excede 8 MB.');
  return list;
}

function validateMode(mode, count) {
  if (!MODES.includes(mode)) throw new Error('Operação não reconhecida.');
  if (mode === 'join' && count < 2) throw new Error('Para unir, escolha pelo menos dois PDFs.');
  if (mode !== 'join' && count !== 1) throw new Error('Esta operação utiliza um PDF por vez.');
}

function checkSignature(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 32 ||
      String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-')
    throw new Error('O arquivo não parece ser um PDF válido.');
}

/** pdfLib é injetado para permitir testes sem rede; deve expor PDFDocument e degrees. */
export async function executePdfOperation({files, mode, pages = '', rotation = 90}, pdfLib) {
  if (!pdfLib?.PDFDocument?.load || !pdfLib?.PDFDocument?.create || !pdfLib?.degrees)
    throw new Error('Motor PDF indisponível. Instale as dependências do projeto.');
  const list = validateInputFiles(files);
  validateMode(mode, list.length);
  const inputDocuments = [];
  let totalSourcePages = 0;
  for (const file of list) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    checkSignature(bytes);
    let document;
    try { document = await pdfLib.PDFDocument.load(bytes, {updateMetadata: false}); }
    catch { throw new Error(`Não foi possível abrir ${file.name || 'o PDF'}. Arquivos protegidos ou corrompidos não são suportados.`); }
    const count = document.getPageCount();
    if (!Number.isInteger(count) || count < 1) throw new Error('PDF sem páginas utilizáveis.');
    totalSourcePages += count;
    if (totalSourcePages > PDF_LIMITS.maxPages) throw new Error('Limite de 80 páginas por operação.');
    inputDocuments.push({document, count});
  }
  const result = await pdfLib.PDFDocument.create();
  let pageOrder = [];
  if (mode === 'join') {
    for (const item of inputDocuments) {
      const indices = Array.from({length:item.count}, (_, i) => i);
      const copied = await result.copyPages(item.document, indices);
      for (const page of copied) result.addPage(page);
      pageOrder.push(...indices);
    }
  } else {
    const item = inputDocuments[0];
    if (mode === 'rotate') {
      if (![90,180,270].includes(Number(rotation))) throw new Error('Rotação permitida: 90, 180 ou 270 graus.');
      const chosen = new Set(parsePageSelection(pages, item.count));
      const indices = Array.from({length:item.count},(_,i)=>i);
      const copied = await result.copyPages(item.document, indices);
      copied.forEach((page,i)=>{
        if (chosen.has(i)) {
          const prior = Number(page.getRotation()?.angle || 0);
          page.setRotation(pdfLib.degrees(((prior + Number(rotation)) % 360 + 360) % 360));
        }
        result.addPage(page);
      });
      pageOrder = indices;
    } else {
      const indices = parsePageSelection(pages, item.count);
      const copied = await result.copyPages(item.document, indices);
      for(const page of copied) result.addPage(page);
      pageOrder = indices;
    }
  }
  if (result.getPageCount() < 1 || result.getPageCount() > PDF_LIMITS.maxPages)
    throw new Error('Resultado sem páginas ou acima do limite.');
  const bytes = await result.save();
  if (!(bytes instanceof Uint8Array) || bytes.length < 8) throw new Error('Falha ao produzir PDF.');
  return {bytes, pages: result.getPageCount(), mode, sourceFiles: list.length, selectedPages:pageOrder.length};
}
