import { supabase } from "./supabase";

// =======================
// Isian Yang Sering Berulang
// =======================
// Dipakai untuk isian seperti Divisi dan Lokasi, supaya yang seharusnya
// SAMA tidak tercatat dobel hanya karena beda huruf besar/kecil atau spasi:
//
//   "Markom" / "MARKOM" / " markom "  ->  dianggap satu: "Markom"

// "  Markom   Digital " -> "Markom Digital"
export const rapikanTeks = (teks) =>
  String(teks ?? "")
    .replace(/\s+/g, " ")
    .trim();

// "human resource" -> "Human Resource"
// (huruf pertama tiap kata jadi kapital, sama seperti initcap di database)
const hurufAwalKapital = (teks) =>
  teks
    .toLowerCase()
    .replace(
      /(^|[^\p{L}\p{N}])(\p{L})/gu,
      (_, pemisah, huruf) => pemisah + huruf.toUpperCase()
    );

// Banyaknya huruf (angka dan tanda baca tidak dihitung)
const jumlahHuruf = (teks) =>
  (teks.match(/\p{L}/gu) ?? []).length;

// Bentuk yang paling lazim:
//   singkatan pendek (3 huruf atau kurang)  "hrd" -> "HRD", "it" -> "IT"
//   selain itu                              "human resource" -> "Human Resource"
const bentukLazim = (teks) =>
  jumlahHuruf(teks) <= 3
    ? teks.toUpperCase()
    : hurufAwalKapital(teks);

const urutAbjad = (a, b) =>
  a.localeCompare(b, "id", { sensitivity: "base" });

const urutKode = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// =======================
// Gabungkan Yang Kembar
// =======================
// ["Markom", "MARKOM", "Markom", "Legal"] -> ["Legal", "Markom"]
//
// Yang hanya beda huruf besar/kecil atau spasi dianggap SAMA.
// Ejaan yang dipakai: bentuk lazim dulu (singkatan pendek "HRD",
// selain itu "Huruf Awal Kapital"); kalau tidak ada yang berbentuk
// itu, yang paling sering dipakai.
// (Aturan yang sama dipakai di SQL perapihan data lama.)
export const gabungkanNilai = (daftarMentah) => {
  const kelompok = new Map();

  for (const mentah of daftarMentah) {
    const ejaan = rapikanTeks(mentah);

    if (!ejaan) continue;

    const kunci = ejaan.toLowerCase();
    const hitung = kelompok.get(kunci) ?? new Map();

    hitung.set(ejaan, (hitung.get(ejaan) ?? 0) + 1);
    kelompok.set(kunci, hitung);
  }

  const hasil = [];

  for (const hitung of kelompok.values()) {
    const [terpilih] = [...hitung.entries()].sort(
      ([a, jumlahA], [b, jumlahB]) =>
        Number(b === bentukLazim(b)) -
          Number(a === bentukLazim(a)) ||
        jumlahB - jumlahA ||
        urutKode(a, b)
    );

    hasil.push(terpilih[0]);
  }

  return hasil.sort(urutAbjad);
};

// =======================
// Cari Ejaan Baku
// =======================
// Mengabaikan huruf besar/kecil dan spasi berlebih.
// cariBaku(["Markom"], " MARKOM ") -> "Markom"
export const cariBaku = (daftar, teks) => {
  const kunci = rapikanTeks(teks).toLowerCase();

  if (!kunci) return null;

  return (
    daftar.find((nilai) => nilai.toLowerCase() === kunci) ?? null
  );
};

// =======================
// Cari Yang Mirip (Salah Ketik)
// =======================
// Jarak edit: berapa kali huruf harus diganti / ditambah / dihapus /
// ditukar supaya satu tulisan jadi tulisan lain.
// "markm" -> "markom" = 1
const jarakEdit = (a, b) => {
  const jarak = Array.from({ length: a.length + 1 }, (_, i) => [i]);

  for (let j = 1; j <= b.length; j++) jarak[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const beda = a[i - 1] === b[j - 1] ? 0 : 1;

      jarak[i][j] = Math.min(
        jarak[i - 1][j] + 1, // hapus
        jarak[i][j - 1] + 1, // tambah
        jarak[i - 1][j - 1] + beda // ganti
      );

      // dua huruf tertukar: "mrakom" -> "markom"
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        jarak[i][j] = Math.min(jarak[i][j], jarak[i - 2][j - 2] + 1);
      }
    }
  }

  return jarak[a.length][b.length];
};

// Yang belum ada tapi mirip dengan yang sudah ada (kemungkinan salah ketik).
// cariMirip(["Markom", "Legal"], "Markm") -> ["Markom"]
// Tulisan di bawah 4 huruf tidak ditebak (terlalu pendek).
export const cariMirip = (daftar, teks) => {
  const kunci = rapikanTeks(teks).toLowerCase();

  if (jumlahHuruf(kunci) < 4) return [];

  const batas = kunci.length >= 8 ? 2 : 1;

  return daftar
    .map((nilai) => ({
      nilai,
      jarak: jarakEdit(kunci, nilai.toLowerCase()),
    }))
    .filter(({ jarak }) => jarak > 0 && jarak <= batas)
    .sort((a, b) => a.jarak - b.jarak || urutAbjad(a.nilai, b.nilai))
    .slice(0, 3)
    .map(({ nilai }) => nilai);
};

// =======================
// Yang Benar-Benar Baru
// =======================
// Diketik huruf kecil semua: "legal" -> "Legal", "hrd" -> "HRD"
// Ada huruf besarnya        : dibiarkan seperti diketik
export const formatBaru = (teks) => {
  const rapi = rapikanTeks(teks);

  if (!rapi) return "";

  return rapi === rapi.toLowerCase() ? bentukLazim(rapi) : rapi;
};

// =======================
// Samakan Ejaan Sebelum Disimpan
// =======================
// Sudah ada di daftar -> pakai ejaan yang sudah ada.
// Belum ada           -> rapikan saja.
export const samakanEjaan = (daftar, teks) =>
  cariBaku(daftar, teks) ?? formatBaru(teks);

// =======================
// Ambil Daftar Dari Database
// =======================
// kolom: "divisi" atau "lokasi"
// Hasil: daftar tanpa kembaran, atau null kalau gagal mengambil.
export const ambilDaftarNilai = async (kolom) => {
  const { data, error } = await supabase
    .from("inventory")
    .select(kolom);

  if (error) {
    console.error(`Gagal mengambil daftar ${kolom}:`, error);
    return null;
  }

  return gabungkanNilai((data || []).map((baris) => baris[kolom]));
};