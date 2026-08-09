// Convert base64 data URI (format yang dipakai semua lampiran file di app ini, ex: profile
// image, technical project files) jadi Blob URL (blob:...).
//
// Perlu ada lapisan ini karena buka data: URI langsung lewat <a href target="_blank"> atau
// window.open() di-block browser modern (Chrome dkk nganggep itu potensi phishing vector) —
// klik-nya keliatan gak ngapa-ngapain. Blob URL gak kena blokir yang sama.
export function dataUriToBlobUrl(dataUri: string): string {
  const [header, base64] = dataUri.split(',');
  const mimeMatch = header.match(/data:(.*);base64/);
  const mime = mimeMatch?.[1] || 'application/octet-stream';

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

// Buka file di tab baru buat preview. Terima base64 data URI (mode dinamis, dikonversi ke
// Blob URL) atau path asset biasa (mode statis, dibuka langsung — bukan data URI).
export function openFilePreview(fileUri: string): boolean {
  if (!fileUri.startsWith('data:')) {
    return window.open(fileUri, '_blank') !== null;
  }

  const blobUrl = dataUriToBlobUrl(fileUri);
  const opened = window.open(blobUrl, '_blank');
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  return opened !== null;
}
