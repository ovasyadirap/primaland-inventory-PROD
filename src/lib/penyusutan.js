// =======================
// Kalkulasi Nilai Penyusutan (Metode Garis Lurus)
// =======================

export function hitungNilaiSekarang(harga, tanggal, masaManfaat) {
  const hargaNum = Number(harga) || 0;
  const masaManfaatNum = Number(masaManfaat);

  if (!masaManfaatNum || !tanggal) return hargaNum;

  const tanggalBeli = new Date(tanggal);
  const sekarang = new Date();

  let bulanBerlalu =
    (sekarang.getFullYear() - tanggalBeli.getFullYear()) * 12 +
    (sekarang.getMonth() - tanggalBeli.getMonth());

  if (bulanBerlalu < 0) bulanBerlalu = 0;

  const totalBulanManfaat = masaManfaatNum * 12;
  const susutPerBulan = hargaNum / totalBulanManfaat;
  const nilaiSekarang = hargaNum - susutPerBulan * bulanBerlalu;

  return Math.max(0, Math.round(nilaiSekarang));
}

export function saranMasaManfaat(harga) {
  const hargaNum = Number(harga) || 0;
  return hargaNum >= 50000000 ? 8 : 4;
}