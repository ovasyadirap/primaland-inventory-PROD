<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { supabase } from "../lib/supabase";
import { v4 as uuidv4 } from "uuid";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const selectedFile = ref(null);
const previewFoto = ref("");

// ID permanen database
const inventoryId = ref(null);

// Untuk mengetahui apakah kode berubah
const kodeAwal = ref("");

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

  masaManfaat: "",
  status: "Aktif",

  // Data Penjualan
  tanggalPenjualan: "",
  hargaJual: "",

  kelengkapan: "",
  foto: "",
});

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
// Ambil Data
// ======================
const loadData = async () => {
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("kode", route.params.kode)
    .single();

  if (error) {
    console.error("Load data error:", error);
    alert("Data tidak ditemukan.");
    router.push("/");
    return;
  }

  inventoryId.value = data.id;
  kodeAwal.value = data.kode;

  // ======================
  // Atur Persentase Residu
  // ======================
  const persenResidu = Number(data.persentase_residu);

  let pilihanResidu = "";
  let customResidu = "";

  if ([5, 10, 20].includes(persenResidu)) {
    pilihanResidu = persenResidu;
  } else if (
    data.persentase_residu !== null &&
    data.persentase_residu !== undefined
  ) {
    pilihanResidu = "custom";
    customResidu = persenResidu;
  }

  form.value = {
    kode: data.kode,
    nama: data.nama,
    divisi: data.divisi,
    pic: data.pic,
    lokasi: data.lokasi,
    tanggal: data.tanggal,
    qty: data.qty,
    harga: data.harga,

    persentaseResidu: pilihanResidu,
    customResidu: customResidu,

    masaManfaat: data.masa_manfaat,
    status: data.status,

    // Data Penjualan
    tanggalPenjualan: data.tanggal_penjualan || "",
    hargaJual: data.harga_jual ?? "",

    kelengkapan: data.kelengkapan,
    foto: data.foto,
  };

  previewFoto.value = data.foto;
};

// ======================
// Pilih Foto
// ======================
const handleFileChange = (event) => {
  const file = event.target.files[0];

  if (!file) return;

  selectedFile.value = file;
  previewFoto.value = URL.createObjectURL(file);
};

// ======================
// Update Data
// ======================
const updateData = async () => {
  // ======================
  // Validasi dasar
  // ======================
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

  // ======================
  // Validasi Residu
  // ======================
  if (!form.value.persentaseResidu) {
    alert("Silakan pilih persentase nilai residu.");
    return;
  }

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

  // ======================
  // Validasi Barang Terjual
  // ======================
  if (form.value.status === "Terjual") {
    if (!form.value.tanggalPenjualan) {
      alert("Tanggal penjualan wajib diisi.");
      return;
    }

    if (
      form.value.hargaJual === "" ||
      Number(form.value.hargaJual) <= 0
    ) {
      alert("Harga jual wajib diisi dan harus lebih dari Rp 0.");
      return;
    }
  }

  // ======================
  // Rapikan kode barang
  // ======================
  const kodeBersih = form.value.kode
    .trim()
    .toUpperCase();

  if (!kodeBersih) {
    alert("Kode barang tidak boleh kosong.");
    return;
  }

  loading.value = true;

  try {
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
      .neq("id", inventoryId.value)
      .limit(1);

    if (checkError) {
      console.error(
        "Gagal mengecek kode:",
        checkError
      );

      alert("Gagal memeriksa kode barang.");
      return;
    }

    if (
      kodeSudahAda &&
      kodeSudahAda.length > 0
    ) {
      alert(
        `Kode barang "${kodeBersih}" sudah digunakan oleh "${kodeSudahAda[0].nama}".\n\nSilakan gunakan kode lain.`
      );

      return;
    }

    form.value.kode = kodeBersih;

    // ======================
    // Upload Foto Baru
    // ======================
    let fotoURL = form.value.foto;

    if (selectedFile.value) {
      const file = selectedFile.value;

      const fileExt = file.name
        .split(".")
        .pop();

      const fileName =
        `${uuidv4()}.${fileExt}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("inventory")
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) {
        console.error(
          "Upload error:",
          uploadError
        );

        alert(uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("inventory")
        .getPublicUrl(fileName);

      fotoURL = data.publicUrl;
    }

    // ======================
    // Cek apakah kode berubah
    // ======================
    const kodeBerubah =
      kodeBersih !== kodeAwal.value;

    // ======================
    // Update Supabase
    // ======================
    const { error } = await supabase
      .from("inventory")
      .update({
        kode: kodeBersih,

        nama: form.value.nama,

        divisi: form.value.divisi,

        pic: form.value.pic,

        lokasi: form.value.lokasi,

        tanggal:
          form.value.tanggal || null,

        qty:
          Number(form.value.qty) || 1,

        harga:
          Number(form.value.harga) || 0,

        // Nilai Residu
        persentase_residu:
          persentaseResiduAktif.value,

        nilai_residu:
          nilaiResidu.value,

        masa_manfaat:
          Number(form.value.masaManfaat) ||
          null,

        status:
          form.value.status,

        // Data Penjualan
        tanggal_penjualan:
          form.value.status === "Terjual"
            ? form.value.tanggalPenjualan
            : null,

        harga_jual:
          form.value.status === "Terjual"
            ? Number(form.value.hargaJual)
            : null,

        kelengkapan:
          form.value.kelengkapan,

        foto:
          fotoURL,
      })

      // Update berdasarkan ID
      .eq("id", inventoryId.value);

    if (error) {
      console.error(
        "Update error:",
        error
      );

      if (error.code === "23505") {
        alert(
          `Kode barang "${kodeBersih}" sudah digunakan. Silakan gunakan kode lain.`
        );

        return;
      }

      alert("Gagal mengubah data.");
      return;
    }

    // ======================
    // Alert berhasil
    // ======================
    if (form.value.status === "Terjual") {
      alert(
        `Inventaris berhasil diperbarui dan ditandai sebagai TERJUAL.\n\nHarga Jual: ${formatRupiah(form.value.hargaJual)}`
      );
    } else if (kodeBerubah) {
      alert(
        `Inventaris berhasil diperbarui!\n\nKode barang berubah dari:\n${kodeAwal.value}\nmenjadi:\n${kodeBersih}\n\nSilakan cetak ulang QR Code inventaris.`
      );
    } else {
      alert(
        "Inventaris berhasil diperbarui!"
      );
    }

    router.push("/");
  } catch (error) {
    console.error(
      "Update inventory error:",
      error
    );

    alert(
      "Terjadi kesalahan saat memperbarui data."
    );
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="min-h-screen bg-slate-100 p-6">

    <!-- Header -->
    <div
      class="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-3xl p-8 shadow-xl"
    >

      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg mb-5 transition"
      >
        ← Kembali
      </RouterLink>

      <h1 class="text-3xl font-bold">
        Edit Inventaris
      </h1>

      <p class="text-amber-100 mt-2">
        Ubah data inventaris
      </p>

    </div>

    <!-- Form -->
    <div
      class="bg-white rounded-3xl shadow-lg p-6 mt-6"
    >

      <div class="grid md:grid-cols-2 gap-5">

        <!-- Kode -->
        <div>
          <label class="font-semibold">
            Kode Barang
          </label>

          <input
            v-model="form.kode"
            type="text"
            class="w-full mt-2 border rounded-xl p-3 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
          />

          <p class="text-xs text-gray-500 mt-1">
            Kode boleh dikoreksi, tetapi tidak boleh sama dengan kode inventaris lain.
          </p>
        </div>

        <!-- Nama -->
        <div>
          <label class="font-semibold">
            Nama Barang
          </label>

          <input
            v-model="form.nama"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <!-- Divisi -->
        <div>
          <label class="font-semibold">
            Divisi
          </label>

          <input
            v-model="form.divisi"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <!-- PIC -->
        <div>
          <label class="font-semibold">
            PIC
          </label>

          <input
            v-model="form.pic"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <!-- Lokasi -->
        <div>
          <label class="font-semibold">
            Lokasi
          </label>

          <input
            v-model="form.lokasi"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <!-- Tanggal Pengadaan -->
        <div>
          <label class="font-semibold">
            Tanggal Pengadaan
          </label>

          <input
            v-model="form.tanggal"
            type="date"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <!-- Qty -->
        <div>
          <label class="font-semibold">
            Qty
          </label>

          <input
            v-model="form.qty"
            type="number"
            min="1"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <!-- Harga -->
        <div>
          <label class="font-semibold">
            Harga Perolehan
          </label>

          <input
            v-model="form.harga"
            type="number"
            min="0"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <!-- Nilai Residu -->
        <div>
          <label class="font-semibold">
            Persentase Nilai Residu
          </label>

          <select
            v-model="form.persentaseResidu"
            class="w-full mt-2 border rounded-xl p-3 bg-white"
          >
            <option
              value=""
              disabled
            >
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
            v-if="
              form.persentaseResidu ===
              'custom'
            "
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
              class="w-full mt-2 border rounded-xl p-3"
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
          <label class="font-semibold">
            Masa Manfaat (Tahun)
          </label>

          <input
            v-model="form.masaManfaat"
            type="number"
            min="1"
            class="w-full mt-2 border rounded-xl p-3"
          />

          <p
            class="text-xs text-gray-500 mt-1"
          >
            Kosongkan jika belum ingin dihitung penyusutannya.
          </p>
        </div>

        <!-- Status -->
        <div>
          <label class="font-semibold">
            Status
          </label>

          <select
            v-model="form.status"
            class="w-full mt-2 border rounded-xl p-3"
          >
            <option>Aktif</option>
            <option>Maintenance</option>
            <option>Rusak</option>
            <option>Hilang</option>

            <!-- Status baru -->
            <option>Terjual</option>
          </select>
        </div>

        <!-- Tanggal Penjualan -->
        <div
          v-if="form.status === 'Terjual'"
        >
          <label class="font-semibold">
            Tanggal Penjualan
          </label>

          <input
            v-model="form.tanggalPenjualan"
            type="date"
            class="w-full mt-2 border border-emerald-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-400 outline-none"
          />

          <p
            class="text-xs text-gray-500 mt-1"
          >
            Tanggal aset resmi terjual.
          </p>
        </div>

        <!-- Harga Jual -->
        <div
          v-if="form.status === 'Terjual'"
        >
          <label class="font-semibold">
            Harga Jual
          </label>

          <input
            v-model="form.hargaJual"
            type="number"
            min="0"
            placeholder="Contoh: 150000000"
            class="w-full mt-2 border border-emerald-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-400 outline-none"
          />

          <div
            v-if="form.hargaJual"
            class="mt-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2"
          >
            <p
              class="text-xs text-slate-500"
            >
              Harga Penjualan
            </p>

            <p
              class="font-bold text-emerald-700 mt-0.5"
            >
              {{ formatRupiah(form.hargaJual) }}
            </p>
          </div>
        </div>

        <!-- Foto -->
        <div>
          <label class="font-semibold">
            Foto Barang
          </label>

          <input
            type="file"
            accept="image/*"
            @change="handleFileChange"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

      </div>

      <!-- Preview Foto -->
      <div
        v-if="previewFoto"
        class="mt-6"
      >
        <label
          class="font-semibold block mb-2"
        >
          Preview Foto
        </label>

        <img
          :src="previewFoto"
          alt="Preview"
          class="w-64 h-64 object-cover rounded-xl border shadow-lg"
        />
      </div>

      <!-- Kelengkapan -->
      <div class="mt-6">

        <label class="font-semibold">
          Kelengkapan Barang
        </label>

        <textarea
          v-model="form.kelengkapan"
          rows="5"
          class="w-full mt-2 border rounded-xl p-3"
        ></textarea>

      </div>

      <!-- Tombol -->
      <div class="flex justify-end mt-8">

        <button
          @click="updateData"
          :disabled="loading"
          class="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold transition"
        >
          {{
            loading
              ? "Menyimpan..."
              : "Simpan Perubahan"
          }}
        </button>

      </div>

    </div>

  </div>
</template>