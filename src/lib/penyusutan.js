// =======================
// Kalkulasi Nilai Penyusutan
// Metode Garis Lurus
// =======================

export function hitungNilaiSekarang(
  harga,
  tanggal,
  masaManfaat,
  nilaiResidu = 0
) {
  const hargaNum = Number(harga) || 0;
  const masaManfaatNum = Number(masaManfaat);

  // Nilai residu
  let nilaiResiduNum = Number(nilaiResidu) || 0;

  // Residu tidak boleh negatif
  if (nilaiResiduNum < 0) {
    nilaiResiduNum = 0;
  }

  // Residu tidak boleh lebih besar dari harga perolehan
  if (nilaiResiduNum > hargaNum) {
    nilaiResiduNum = hargaNum;
  }

  // Kalau masa manfaat / tanggal belum ada,
  // nilai aset tetap harga perolehan
  if (!masaManfaatNum || !tanggal) {
    return hargaNum;
  }

  const tanggalBeli = new Date(tanggal);
  const sekarang = new Date();

  // =======================
  // Hitung umur aset dalam bulan
  // =======================
  let bulanBerlalu =
    (sekarang.getFullYear() - tanggalBeli.getFullYear()) * 12 +
    (sekarang.getMonth() - tanggalBeli.getMonth());

  if (bulanBerlalu < 0) {
    bulanBerlalu = 0;
  }

  // =======================
  // Total masa manfaat
  // =======================
  const totalBulanManfaat =
    masaManfaatNum * 12;

  // =======================
  // Nilai yang dapat disusutkan
  // =======================
  const nilaiDisusutkan =
    hargaNum - nilaiResiduNum;

  // =======================
  // Penyusutan per bulan
  // =======================
  const susutPerBulan =
    nilaiDisusutkan / totalBulanManfaat;

  // =======================
  // Akumulasi Penyusutan
  // =======================
  const akumulasiPenyusutan =
    susutPerBulan * bulanBerlalu;

  // =======================
  // Nilai Buku Saat Ini
  // =======================
  const nilaiSekarang =
    hargaNum - akumulasiPenyusutan;

  // Nilai buku tidak boleh
  // lebih rendah dari nilai residu
  return Math.max(
    nilaiResiduNum,
    Math.round(nilaiSekarang)
  );
}


// =======================
// Saran Masa Manfaat
// =======================

export function saranMasaManfaat(harga) {
  const hargaNum = Number(harga) || 0;

  return hargaNum >= 50000000 ? 8 : 4;
}