<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "../lib/supabase";
import { hitungNilaiSekarang } from "../lib/penyusutan";

import {
  Calendar,
  Building2,
  Package,
  Wallet,
  BadgeCheck,
  QrCode,
  MapPin,
  User,
  TrendingDown,
} from "lucide-vue-next";

const route = useRoute();

const barang = ref(null);
const loading = ref(true);

// ======================
// Ambil Data dari Supabase
// ======================
const loadData = async () => {
  loading.value = true;

  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("kode", route.params.kode)
    .single();

  if (error) {
    console.error(error);
    barang.value = null;
    loading.value = false;
    return;
  }

  barang.value = data;
  loading.value = false;
};

// ======================
// Format Rupiah
// ======================
const formatRupiah = (harga) => {
  if (harga === null || harga === undefined) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(harga) || 0);
};

// ======================
// Format Tanggal
// ======================
const formatTanggal = (tanggal) => {
  if (!tanggal) return "-";

  return new Date(tanggal).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// ======================
// Nilai Buku Saat Ini
// ======================
const nilaiSekarang = computed(() => {
  if (!barang.value) return 0;

  return hitungNilaiSekarang(
    barang.value.harga,
    barang.value.tanggal,
    barang.value.masa_manfaat,
    barang.value.nilai_residu
  );
});

// ======================
// Badge Status
// ======================
const statusClass = (status) => {
  switch (status) {
    case "Aktif":
      return "bg-green-100 text-green-700";

    case "Maintenance":
      return "bg-yellow-100 text-yellow-700";

    case "Rusak":
      return "bg-red-100 text-red-700";

    case "Hilang":
    return "bg-gray-200 text-gray-700";

    case "Terjual":
      return "bg-emerald-100 text-emerald-700";

    default:
      return "bg-blue-100 text-blue-700";
  }
};

// ======================
// Kelengkapan
// ======================
const listKelengkapan = () => {
  if (!barang.value?.kelengkapan) return [];

  if (Array.isArray(barang.value.kelengkapan)) {
    return barang.value.kelengkapan;
  }

  return barang.value.kelengkapan
    .split(/,|\n/)
    .map((item) => item.replace(/^-\s*/, "").trim())
    .filter(Boolean);
};

// ======================
// Unduh Foto Barang
// ======================
const downloadFoto = async () => {
  if (!barang.value?.foto) {
    alert("Foto barang belum tersedia.");
    return;
  }

  try {
    const response = await fetch(barang.value.foto);

    if (!response.ok) {
      throw new Error("Gagal mengambil foto.");
    }

    const blob = await response.blob();

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    const kodeBarang =
      barang.value.kode
        ?.replace(/[^a-zA-Z0-9-_]/g, "-") ||
      "inventaris";

    link.href = url;
    link.download = `${kodeBarang}-foto.jpg`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);

    alert("Gagal mengunduh foto barang.");
  }
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="min-h-screen bg-slate-100 py-10 px-4">

    <!-- Loading -->
    <div
      v-if="loading"
      class="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-10 text-center"
    >
      <h2 class="text-xl font-bold">
        Memuat Data...
      </h2>
    </div>

    <!-- Data -->
    <div
      v-else-if="barang"
      class="max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden"
    >

      <!-- Header -->
      <div class="bg-green-700 text-white p-7 text-center">

        <h1 class="text-2xl font-bold">
          PRIMALAND 2
        </h1>

        <p class="text-green-100 mt-1">
          Inventory Management
        </p>

      </div>

      <!-- Content -->
      <div class="p-6">

        <!-- Foto -->
        <div
          class="relative rounded-2xl h-80 w-full overflow-hidden border border-slate-200"
        >
          <img
            :src="barang.foto || 'https://placehold.co/600x400?text=No+Image'"
            class="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50"
            aria-hidden="true"
          />

          <img
            :src="barang.foto || 'https://placehold.co/600x400?text=No+Image'"
            :alt="barang.nama"
            class="relative w-full h-full object-contain"
          />
        </div>

        <!-- Unduh Foto -->
        <button
          v-if="barang.foto"
          @click="downloadFoto"
          class="w-full mt-3 bg-white border border-emerald-600 text-emerald-700 py-2.5 rounded-xl font-semibold hover:bg-emerald-50 transition flex items-center justify-center gap-2"
        >
          ↓ Unduh Foto Barang
        </button>

        <!-- Nama -->
        <h2 class="text-2xl font-bold text-center mt-6">
          {{ barang.nama }}
        </h2>

        <!-- Lokasi -->
        <div
          v-if="barang.lokasi"
          class="flex justify-center items-center gap-2 mt-2 text-gray-500"
        >
          <MapPin
            :size="18"
            class="text-green-700"
          />

          <span>
            {{ barang.lokasi }}
          </span>
        </div>

        <!-- Status -->
        <div class="flex justify-center mt-4">

          <span
            :class="statusClass(barang.status)"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold"
          >
            <BadgeCheck :size="18" />

            {{ barang.status }}
          </span>

        </div>

        <!-- Detail -->
        <div class="mt-8 space-y-4">

          <!-- Tanggal Pengadaan -->
          <div
            class="bg-gray-50 rounded-xl p-4 flex items-center gap-3"
          >
            <Calendar class="text-green-700" />

            <div>
              <p class="text-sm text-gray-500">
                Tanggal Pengadaan
              </p>

              <p class="font-semibold">
                {{ formatTanggal(barang.tanggal) }}
              </p>
            </div>
          </div>

          <!-- Kode Barang -->
          <div
            class="bg-gray-50 rounded-xl p-4 flex items-center gap-3"
          >
            <QrCode class="text-green-700" />

            <div>
              <p class="text-sm text-gray-500">
                Kode Barang
              </p>

              <p class="font-semibold">
                {{ barang.kode }}
              </p>
            </div>
          </div>

          <!-- Divisi -->
          <div
            class="bg-gray-50 rounded-xl p-4 flex items-center gap-3"
          >
            <Building2 class="text-green-700" />

            <div>
              <p class="text-sm text-gray-500">
                Divisi
              </p>

              <p class="font-semibold">
                {{ barang.divisi }}
              </p>
            </div>
          </div>

          <!-- PIC -->
          <div
            v-if="barang.pic"
            class="bg-gray-50 rounded-xl p-4 flex items-center gap-3"
          >
            <User class="text-green-700" />

            <div>
              <p class="text-sm text-gray-500">
                PIC
              </p>

              <p class="font-semibold">
                {{ barang.pic }}
              </p>
            </div>
          </div>

          <!-- Qty -->
          <div
            class="bg-gray-50 rounded-xl p-4 flex items-center gap-3"
          >
            <Package class="text-green-700" />

            <div>
              <p class="text-sm text-gray-500">
                Qty
              </p>

              <p class="font-semibold">
                {{ barang.qty }}
              </p>
            </div>
          </div>

          <!-- Harga Perolehan -->
          <div
            class="bg-gray-50 rounded-xl p-4 flex items-center gap-3"
          >
            <Wallet class="text-green-700" />

            <div>
              <p class="text-sm text-gray-500">
                Harga Perolehan
              </p>

              <p class="font-bold text-green-700">
                {{ formatRupiah(barang.harga) }}
              </p>
            </div>
          </div>

          <!-- Nilai Residu -->
          <div
            v-if="
              barang.nilai_residu !== null &&
              barang.nilai_residu !== undefined
            "
            class="bg-emerald-50 rounded-xl p-4 flex items-center gap-3"
          >
            <Wallet class="text-emerald-600" />

            <div>
              <p class="text-sm text-gray-500">
                Nilai Residu
              </p>

              <p class="font-bold text-emerald-700">
                {{ formatRupiah(barang.nilai_residu) }}
              </p>

              <p
                v-if="
                  barang.persentase_residu !== null &&
                  barang.persentase_residu !== undefined
                "
                class="text-xs text-gray-500 mt-1"
              >
                {{ barang.persentase_residu }}% dari harga perolehan
              </p>
            </div>
          </div>

          <!-- Masa Manfaat -->
          <div
            v-if="barang.masa_manfaat"
            class="bg-gray-50 rounded-xl p-4 flex items-center gap-3"
          >
            <Calendar class="text-green-700" />

            <div>
              <p class="text-sm text-gray-500">
                Masa Manfaat
              </p>

              <p class="font-semibold">
                {{ barang.masa_manfaat }} Tahun
              </p>
            </div>
          </div>

          <!-- Nilai Buku Saat Ini -->
          <div
            v-if="barang.masa_manfaat"
            class="bg-indigo-50 rounded-xl p-4 flex items-center gap-3"
          >
            <TrendingDown class="text-indigo-600" />

            <div>
              <p class="text-sm text-gray-500">
                Nilai Buku Saat Ini
              </p>

              <p class="font-bold text-indigo-600">
                {{ formatRupiah(nilaiSekarang) }}
              </p>
            </div>
          </div>

                    <!-- Informasi Penjualan -->
          <div
            v-if="barang.status === 'Terjual'"
            class="bg-emerald-50 border border-emerald-200 rounded-xl p-4"
          >
            <div class="flex items-center gap-3 mb-4">
              <Wallet class="text-emerald-600" />

              <div>
                <p class="font-bold text-emerald-700">
                  Informasi Penjualan
                </p>

                <p class="text-xs text-gray-500 mt-0.5">
                  Riwayat penjualan inventaris
                </p>
              </div>
            </div>

            <div class="space-y-3">

              <!-- Tanggal Penjualan -->
              <div>
                <p class="text-sm text-gray-500">
                  Tanggal Penjualan
                </p>

                <p class="font-semibold text-slate-700">
                  {{ formatTanggal(barang.tanggal_penjualan) }}
                </p>
              </div>

              <!-- Harga Jual -->
              <div>
                <p class="text-sm text-gray-500">
                  Harga Jual
                </p>

                <p class="font-bold text-emerald-700">
                  {{ formatRupiah(barang.harga_jual) }}
                </p>
              </div>

            </div>
          </div>

          <!-- Kelengkapan -->
          <div class="bg-gray-50 rounded-xl p-4">

            <div class="flex items-center gap-3 mb-3">

              <Package class="text-green-700" />

              <p class="text-sm text-gray-500 font-medium">
                Kelengkapan Barang
              </p>

            </div>

            <ul
              v-if="listKelengkapan().length"
              class="space-y-2"
            >
              <li
                v-for="(item, index) in listKelengkapan()"
                :key="index"
                class="flex items-center gap-2"
              >
                <span class="text-green-600 font-bold">
                  ✓
                </span>

                <span>
                  {{ item }}
                </span>
              </li>
            </ul>

            <p
              v-else
              class="text-sm text-gray-400"
            >
              Tidak ada data kelengkapan.
            </p>

          </div>

        </div>

      </div>

      <!-- Footer -->
      <div class="text-center py-5 text-sm text-gray-400">
        © 2026 Primaland 2
      </div>

    </div>

    <!-- Tidak ditemukan -->
    <div
      v-else
      class="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-10 text-center"
    >

      <Package
        class="mx-auto text-gray-400"
        :size="60"
      />

      <h2 class="text-xl font-bold mt-5">
        Data Inventaris Tidak Ditemukan
      </h2>

      <p class="text-gray-500 mt-2">
        QR Code tidak valid atau data sudah dihapus.
      </p>

    </div>

  </div>
</template>