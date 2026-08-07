<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "../lib/supabase";

import {
  Calendar,
  Building2,
  Package,
  Wallet,
  BadgeCheck,
  QrCode,
  MapPin,
  User,
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
  if (!harga) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(harga);
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

    default:
      return "bg-blue-100 text-blue-700";
  }
};

// ======================
// Kelengkapan
// ======================
const listKelengkapan = () => {
  if (!barang.value?.kelengkapan) return [];

  if (Array.isArray(barang.value.kelengkapan))
    return barang.value.kelengkapan;

  return barang.value.kelengkapan
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
        <div class="relative rounded-2xl h-80 w-full overflow-hidden border border-slate-200">
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

        <!-- Nama -->
        <h2 class="text-2xl font-bold text-center mt-6">
          {{ barang.nama }}
        </h2>

        <!-- Lokasi -->
        <div
          v-if="barang.lokasi"
          class="flex justify-center items-center gap-2 mt-2 text-gray-500"
        >
          <MapPin :size="18" class="text-green-700" />
          <span>{{ barang.lokasi }}</span>
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

          <div class="bg-gray-50 rounded-xl p-4 flex items-center gap-3">

            <Calendar class="text-green-700"/>

            <div>

              <p class="text-sm text-gray-500">
                Tanggal Pengadaan
              </p>

              <p class="font-semibold">
                {{ formatTanggal(barang.tanggal) }}
              </p>

            </div>

          </div>

          <div class="bg-gray-50 rounded-xl p-4 flex items-center gap-3">

            <QrCode class="text-green-700"/>

            <div>

              <p class="text-sm text-gray-500">
                Kode Barang
              </p>

              <p class="font-semibold">
                {{ barang.kode }}
              </p>

            </div>

          </div>

          <div class="bg-gray-50 rounded-xl p-4 flex items-center gap-3">

            <Building2 class="text-green-700"/>

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

            <User class="text-green-700"/>

            <div>

              <p class="text-sm text-gray-500">
                PIC
              </p>

              <p class="font-semibold">
                {{ barang.pic }}
              </p>

            </div>

          </div>

          <div class="bg-gray-50 rounded-xl p-4 flex items-center gap-3">

            <Package class="text-green-700"/>

            <div>

              <p class="text-sm text-gray-500">
                Qty
              </p>

              <p class="font-semibold">
                {{ barang.qty }}
              </p>

            </div>

          </div>

          <div class="bg-gray-50 rounded-xl p-4 flex items-center gap-3">

            <Wallet class="text-green-700"/>

            <div>

              <p class="text-sm text-gray-500">
                Harga
              </p>

              <p class="font-bold text-green-700">
                {{ formatRupiah(barang.harga) }}
              </p>

            </div>

          </div>

          <!-- Kelengkapan -->
          <div class="bg-gray-50 rounded-xl p-4">

            <div class="flex items-center gap-3 mb-3">

              <Package class="text-green-700"/>

              <p class="text-sm text-gray-500 font-medium">
                Kelengkapan Barang
              </p>

            </div>

            <ul class="space-y-2">

              <li
                v-for="(item,index) in listKelengkapan()"
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