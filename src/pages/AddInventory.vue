<script setup>
import { ref, watch } from "vue";
import { saranMasaManfaat } from "../lib/penyusutan";
import { RouterLink, useRouter } from "vue-router";
import { supabase } from "../lib/supabase";

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
  masaManfaat: 4,
  status: "Aktif",
  kelengkapan: "",
  foto: "",
});

const masaManfaatDisentuh = ref(false);

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
// Pilih Foto
// Foto belum langsung diupload
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
  // Validasi dasar
  if (
    !form.value.kode ||
    !form.value.nama ||
    !form.value.divisi
  ) {
    alert("Mohon lengkapi Kode Barang, Nama Barang, dan Divisi.");
    return;
  }

  loading.value = true;

  try {
    // ======================
    // Normalisasi kode
    // ======================
    const kodeBersih = form.value.kode
      .trim()
      .toUpperCase();

    // ======================
    // Cek kode duplikat
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

    // Simpan kode yang sudah dirapikan
    form.value.kode = kodeBersih;

    // ======================
    // Upload foto
    // dilakukan setelah kode aman
    // ======================
    let fotoURL = "";

    if (selectedFile.value) {
      try {
        fotoURL = await uploadFoto();
      } catch (uploadError) {
        console.error("Upload foto gagal:", uploadError);
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
          masa_manfaat:
            Number(form.value.masaManfaat) || null,
          status: form.value.status,
          kelengkapan: form.value.kelengkapan,
          foto: fotoURL || null,
        },
      ]);

    if (error) {
      console.error("Insert error:", error);

      // Jika nanti UNIQUE constraint sudah dipasang
      if (error.code === "23505") {
        alert(
          `Kode barang "${form.value.kode}" sudah digunakan. Silakan gunakan kode lain.`
        );
        return;
      }

      alert("Gagal menyimpan data inventaris.");
      return;
    }

    alert("Inventaris berhasil ditambahkan!");

    router.push("/");
  } catch (error) {
    console.error("Error:", error);
    alert("Terjadi kesalahan saat menyimpan data.");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-100 p-6">

    <!-- Header -->
    <div class="bg-green-700 text-white rounded-2xl p-6 shadow-lg">

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
    <div class="bg-white rounded-2xl shadow-lg p-6 mt-6">

      <div class="grid md:grid-cols-2 gap-5">

        <!-- Kode -->
        <div>
          <label class="font-semibold">Kode Barang</label>

          <input
            v-model="form.kode"
            type="text"
            placeholder="PL2-PROYEK-001-2026"
            class="w-full mt-2 border rounded-xl p-3"
          />

          <p class="text-xs text-gray-500 mt-1">
            Kode barang tidak boleh sama dengan inventaris yang sudah ada.
          </p>
        </div>

        <!-- Nama -->
        <div>
          <label class="font-semibold">Nama Barang</label>

          <input
            v-model="form.nama"
            type="text"
            placeholder="Laptop ASUS"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <!-- Divisi -->
        <div>
          <label class="font-semibold">Divisi</label>

          <input
            v-model="form.divisi"
            type="text"
            placeholder="Operasional"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <!-- PIC -->
        <div>
          <label class="font-semibold">PIC</label>

          <input
            v-model="form.pic"
            type="text"
            placeholder="Nama PIC"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <!-- Lokasi -->
        <div>
          <label class="font-semibold">Lokasi</label>

          <input
            v-model="form.lokasi"
            type="text"
            placeholder="Contoh: Gudang A"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <!-- Tanggal -->
        <div>
          <label class="font-semibold">Tanggal Pengadaan</label>

          <input
            v-model="form.tanggal"
            type="date"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <!-- Qty -->
        <div>
          <label class="font-semibold">Qty</label>

          <input
            v-model="form.qty"
            type="number"
            min="1"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <!-- Harga -->
        <div>
          <label class="font-semibold">Harga</label>

          <input
            v-model="form.harga"
            type="number"
            min="0"
            placeholder="8500000"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <!-- Masa Manfaat -->
        <div>
          <label class="font-semibold">
            Masa Manfaat (Tahun)
          </label>

          <input
            v-model="form.masaManfaat"
            @input="masaManfaatDisentuh = true"
            type="number"
            min="1"
            class="w-full mt-2 border rounded-xl p-3"
          />

          <p class="text-xs text-gray-500 mt-1">
            Otomatis tersaran dari Harga
            (≥50jt → 8 thn, di bawah itu → 4 thn),
            bisa diubah manual.
          </p>
        </div>

        <!-- Status -->
        <div>
          <label class="font-semibold">Status</label>

          <select
            v-model="form.status"
            class="w-full mt-2 border rounded-xl p-3"
          >
            <option>Aktif</option>
            <option>Maintenance</option>
            <option>Rusak</option>
            <option>Hilang</option>
          </select>
        </div>

        <!-- Foto -->
        <div>
          <label class="font-semibold">Foto Barang</label>

          <input
            type="file"
            accept="image/*"
            @change="pilihFoto"
            class="w-full mt-2 border rounded-xl p-2"
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

        <label class="font-semibold">
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
          class="w-full mt-2 border rounded-xl p-3"
        ></textarea>

      </div>

      <!-- Tombol -->
      <div class="flex justify-end gap-3 mt-8">

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
          {{ loading ? "Menyimpan..." : "Simpan Inventaris" }}
        </button>

      </div>

    </div>

  </div>
</template>