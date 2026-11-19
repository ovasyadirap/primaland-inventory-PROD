<script setup>
import { ref, watch, computed, onMounted } from "vue";
import { saranMasaManfaat } from "../lib/penyusutan";
import { RouterLink, useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import PilihanKategori from "../components/PilihanKategori.vue";
import { ambilDaftarNilai, samakanEjaan } from "../lib/kategori";

const router = useRouter();

const loading = ref(false);
const selectedFile = ref(null);

const form = ref({
  kode: "",
  nama: "",
  divisi: "",
  pic: "",
  lokasi: "",
  tanggal: "",
  qty: 1,
  harga: "",

  // Nilai Residu
  persentaseResidu: "",
  customResidu: "",

  masaManfaat: 4,
  status: "Aktif",
  kelengkapan: "",
  foto: "",
});

const masaManfaatDisentuh = ref(false);

// ======================
// Daftar Divisi
// ======================
// Untuk pilihan Divisi, supaya tidak ada yang dobel
// (misalnya "Markom" dan "MARKOM")
const daftarDivisi = ref([]);

onMounted(async () => {
  daftarDivisi.value =
    (await ambilDaftarNilai("divisi")) ?? [];
});

// ======================
// Saran Masa Manfaat
// ======================
watch(
  () => form.value.harga,
  (hargaBaru) => {
    if (!masaManfaatDisentuh.value) {
      form.value.masaManfaat = saranMasaManfaat(hargaBaru);
    }
  }
);

// ======================
// Persentase Residu Aktif
// ======================
const persentaseResiduAktif = computed(() => {
  if (form.value.persentaseResidu === "custom") {
    return Number(form.value.customResidu) || 0;
  }

  return Number(form.value.persentaseResidu) || 0;
});

// ======================
// Hitung Nilai Residu
// ======================
const nilaiResidu = computed(() => {
  const harga = Number(form.value.harga) || 0;

  if (!form.value.persentaseResidu) {
    return 0;
  }

  return Math.round(
    harga * (persentaseResiduAktif.value / 100)
  );
});

// ======================
// Format Rupiah
// ======================
const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(angka) || 0);
};

// ======================
// Pilih Foto
// ======================
const pilihFoto = (event) => {
  const file = event.target.files[0];

  if (!file) {
    selectedFile.value = null;
    return;
  }

  selectedFile.value = file;
};

// ======================
// Upload Foto
// ======================
const uploadFoto = async () => {
  if (!selectedFile.value) return "";

  const file = selectedFile.value;

  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

  const { error: uploadError } = await supabase.storage
    .from("inventory")
    .upload(fileName, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from("inventory")
    .getPublicUrl(fileName);

  return data.publicUrl;
};

// ======================
// Simpan Data
// ======================
const simpanData = async () => {
  // Validasi data wajib
  if (
    !form.value.kode ||
    !form.value.nama ||
    !form.value.divisi
  ) {
    alert(
      "Mohon lengkapi Kode Barang, Nama Barang, dan Divisi."
    );
    return;
  }

  // Persentase residu wajib dipilih
  if (!form.value.persentaseResidu) {
    alert("Silakan pilih persentase nilai residu.");
    return;
  }

  // Validasi custom
  if (form.value.persentaseResidu === "custom") {
    const custom = Number(form.value.customResidu);

    if (
      form.value.customResidu === "" ||
      custom < 0 ||
      custom > 100
    ) {
      alert(
        "Persentase residu custom harus antara 0% sampai 100%."
      );
      return;
    }
  }

  loading.value = true;

  try {
    // ======================
    // Normalisasi Kode
    // ======================
    const kodeBersih = form.value.kode
      .trim()
      .toUpperCase();

    // ======================
    // Cek Kode Duplikat
    // ======================
    const {
      data: kodeSudahAda,
      error: checkError,
    } = await supabase
      .from("inventory")
      .select("id, kode, nama")
      .ilike("kode", kodeBersih)
      .limit(1);

    if (checkError) {
      console.error("Gagal cek kode:", checkError);
      alert("Gagal memeriksa kode barang.");
      return;
    }

    if (kodeSudahAda && kodeSudahAda.length > 0) {
      alert(
        `Kode barang "${kodeBersih}" sudah digunakan oleh "${kodeSudahAda[0].nama}".\n\nSilakan gunakan kode lain.`
      );
      return;
    }

    form.value.kode = kodeBersih;

    // ======================
    // Samakan Ejaan Divisi
    // ======================
    // Ambil daftar terbaru dulu (bisa jadi tim lain baru
    // menambah divisi saat form ini sedang dibuka)
    const daftarTerbaru =
      (await ambilDaftarNilai("divisi")) ??
      daftarDivisi.value;

    form.value.divisi = samakanEjaan(
      daftarTerbaru,
      form.value.divisi
    );

    // ======================
    // Upload Foto
    // ======================
    let fotoURL = "";

    if (selectedFile.value) {
      try {
        fotoURL = await uploadFoto();
      } catch (uploadError) {
        console.error(
          "Upload foto gagal:",
          uploadError
        );

        alert("Upload foto gagal.");
        return;
      }
    }

    // ======================
    // Insert Inventory
    // ======================
    const { error } = await supabase
      .from("inventory")
      .insert([
        {
          kode: form.value.kode,
          nama: form.value.nama,
          divisi: form.value.divisi,
          pic: form.value.pic,
          lokasi: form.value.lokasi,
          tanggal: form.value.tanggal || null,

          qty: Number(form.value.qty) || 1,

          harga: Number(form.value.harga) || 0,

          persentase_residu:
            persentaseResiduAktif.value,

          nilai_residu:
            nilaiResidu.value,

          masa_manfaat:
            Number(form.value.masaManfaat) || null,

          status: form.value.status,

          kelengkapan:
            form.value.kelengkapan,

          foto: fotoURL || null,
        },
      ]);

    if (error) {
      console.error(
        "Insert error:",
        error
      );

      // Unique kode
      if (error.code === "23505") {
        alert(
          `Kode barang "${form.value.kode}" sudah digunakan. Silakan gunakan kode lain.`
        );
        return;
      }

      alert(
        "Gagal menyimpan data inventaris."
      );

      return;
    }

    alert(
      "Inventaris berhasil ditambahkan!"
    );

    router.push("/");
  } catch (error) {
    console.error(
      "Error:",
      error
    );

    alert(
      "Terjadi kesalahan saat menyimpan data."
    );
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-100 p-6">

    <!-- Header -->
    <div
      class="bg-green-700 text-white rounded-2xl p-6 shadow-lg"
    >

      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg mb-5 transition"
      >
        ← Kembali
      </RouterLink>

      <h1 class="text-3xl font-bold">
        Tambah Inventaris
      </h1>

      <p class="text-green-100 mt-1">
        PRIMALAND 2 Inventory Management
      </p>

    </div>

    <!-- Form -->
    <div
      class="bg-white rounded-2xl shadow-lg p-6 mt-6"
    >

      <div class="grid md:grid-cols-2 gap-5">

        <!-- Kode -->
        <div>
          <label class="label-isian">
            Kode Barang
          </label>

          <input
            v-model="form.kode"
            type="text"
            placeholder="PL2-PROYEK-001-2026"
            class="kotak-isian mt-2"
          />

          <p class="text-xs text-gray-500 mt-1">
            Kode barang tidak boleh sama dengan inventaris yang sudah ada.
          </p>
        </div>

        <!-- Nama -->
        <div>
          <label class="label-isian">
            Nama Barang
          </label>

          <input
            v-model="form.nama"
            type="text"
            placeholder="Laptop ASUS"
            class="kotak-isian mt-2"
          />
        </div>

        <!-- Divisi -->
        <div>
          <label class="label-isian">
            Divisi
          </label>

          <PilihanKategori
            v-model="form.divisi"
            :opsi="daftarDivisi"
            label="divisi"
          />
        </div>

        <!-- PIC -->
        <div>
          <label class="label-isian">
            PIC
          </label>

          <input
            v-model="form.pic"
            type="text"
            placeholder="Nama PIC"
            class="kotak-isian mt-2"
          />
        </div>

        <!-- Lokasi -->
        <div>
          <label class="label-isian">
            Lokasi
          </label>

          <input
            v-model="form.lokasi"
            type="text"
            placeholder="Contoh: Gudang A"
            class="kotak-isian mt-2"
          />
        </div>

        <!-- Tanggal -->
        <div>
          <label class="label-isian">
            Tanggal Pengadaan
          </label>

          <input
            v-model="form.tanggal"
            type="date"
            class="kotak-isian mt-2"
          />
        </div>

        <!-- Qty -->
        <div>
          <label class="label-isian">
            Qty
          </label>

          <input
            v-model="form.qty"
            type="number"
            min="1"
            class="kotak-isian mt-2"
          />
        </div>

        <!-- Harga -->
        <div>
          <label class="label-isian">
            Harga
          </label>

          <input
            v-model="form.harga"
            type="number"
            min="0"
            placeholder="8500000"
            class="kotak-isian mt-2"
          />
        </div>

        <!-- Persentase Nilai Residu -->
        <div>
          <label class="label-isian">
            Persentase Nilai Residu
          </label>

          <select
            v-model="form.persentaseResidu"
            class="kotak-isian mt-2"
          >
            <option value="" disabled>
              Pilih Persentase
            </option>

            <option :value="5">
              5%
            </option>

            <option :value="10">
              10%
            </option>

            <option :value="20">
              20%
            </option>

            <option value="custom">
              Custom
            </option>
          </select>

          <!-- Custom -->
          <div
            v-if="form.persentaseResidu === 'custom'"
            class="mt-3"
          >
            <label
              class="text-sm font-medium text-slate-600"
            >
              Custom Persentase (%)
            </label>

            <input
              v-model="form.customResidu"
              type="number"
              min="0"
              max="100"
              placeholder="Contoh: 15"
              class="kotak-isian mt-2"
            />
          </div>

          <!-- Preview -->
          <div
            v-if="form.persentaseResidu"
            class="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3"
          >
            <p
              class="text-xs text-slate-500"
            >
              Estimasi Nilai Residu
            </p>

            <p
              class="font-bold text-emerald-700 mt-1"
            >
              {{ formatRupiah(nilaiResidu) }}
            </p>

            <p
              class="text-xs text-slate-500 mt-1"
            >
              {{ persentaseResiduAktif }}%
              dari harga perolehan
            </p>
          </div>

        </div>

        <!-- Masa Manfaat -->
        <div>
          <label class="label-isian">
            Masa Manfaat (Tahun)
          </label>

          <input
            v-model="form.masaManfaat"
            @input="masaManfaatDisentuh = true"
            type="number"
            min="1"
            class="kotak-isian mt-2"
          />

          <p
            class="text-xs text-gray-500 mt-1"
          >
            Otomatis tersaran dari Harga
            (≥50jt → 8 thn, di bawah itu → 4 thn),
            bisa diubah manual.
          </p>
        </div>

        <!-- Status -->
        <div>
          <label class="label-isian">
            Status
          </label>

          <select
            v-model="form.status"
            class="kotak-isian mt-2"
          >
            <option>Aktif</option>
            <option>Maintenance</option>
            <option>Rusak</option>
            <option>Hilang</option>
          </select>
        </div>

        <!-- Foto -->
        <div>
          <label class="label-isian">
            Foto Barang
          </label>

          <input
            type="file"
            accept="image/*"
            @change="pilihFoto"
            class="kotak-isian mt-2 px-3 py-2"
          />

          <p
            v-if="selectedFile"
            class="text-green-600 text-sm mt-2"
          >
            ✓ Foto siap diupload saat data disimpan
          </p>
        </div>

      </div>

      <!-- Kelengkapan -->
      <div class="mt-6">

        <label class="label-isian">
          Kelengkapan Barang
        </label>

        <textarea
          v-model="form.kelengkapan"
          rows="5"
          placeholder="Contoh:
- Charger
- Mouse
- Tas Laptop
- Surat Garansi"
          class="kotak-isian mt-2"
        ></textarea>

      </div>

      <!-- Tombol -->
      <div
        class="flex justify-end gap-3 mt-8"
      >

        <RouterLink
          to="/"
          class="px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
        >
          Batal
        </RouterLink>

        <button
          @click="simpanData"
          :disabled="loading"
          class="bg-green-700 hover:bg-green-800 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl transition"
        >
          {{
            loading
              ? "Menyimpan..."
              : "Simpan Inventaris"
          }}
        </button>

      </div>

    </div>

  </div>
</template>