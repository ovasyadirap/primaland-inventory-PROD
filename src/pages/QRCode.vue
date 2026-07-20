<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { supabase } from "../lib/supabase";
import QRCodeVue3 from "qrcode.vue";
import domtoimage from "dom-to-image-more";

const route = useRoute();

const qrCard = ref(null);
const barang = ref(null);
const loading = ref(true);

// ======================
// Ambil Data
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
  } else {
    barang.value = data;
  }

  loading.value = false;
};

// ======================
// Link QR
// ======================
const qrValue = computed(() => {
  return `${window.location.origin}/inventory/${route.params.kode}`;
});

// ======================
// Download QR
// ======================
const downloadQR = async () => {
  await nextTick();

  if (!qrCard.value) {
    alert("QR belum siap.");
    return;
  }

  try {
    const dataUrl = await domtoimage.toPng(qrCard.value, {
      quality: 1,
      bgcolor: "#ffffff",
      cacheBust: true,
    });

    const link = document.createElement("a");
    link.download = `${barang.value.kode}.png`;
    link.href = dataUrl;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error(err);
    alert("Gagal mendownload QR Code.");
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
      class="bg-gradient-to-r from-green-700 to-emerald-600 text-white rounded-3xl p-8 shadow-xl"
    >

      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg mb-5 transition"
      >
        ← Kembali
      </RouterLink>

      <h1 class="text-3xl font-bold">
        QR Code Inventaris
      </h1>

      <p class="text-green-100 mt-2">
        Download Label Inventaris
      </p>

    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="text-center mt-12"
    >
      <h2 class="text-xl font-semibold">
        Memuat...
      </h2>
    </div>

    <!-- Card QR -->
    <div
      v-else-if="barang"
      class="max-w-lg mx-auto mt-8"
    >

      <div
        ref="qrCard"
        class="bg-white rounded-3xl shadow-2xl overflow-hidden"
      >

        <!-- Header Card -->
        <div
          class="bg-gradient-to-r from-green-700 to-emerald-600 text-white text-center py-6"
        >
          <h2 class="text-2xl font-bold">
            PRIMALAND 2
          </h2>

          <p class="text-green-100 text-sm">
            Inventory Management
          </p>
        </div>

        <!-- Body -->
        <div class="p-8 text-center">

          <!-- QR -->
          <div
            class="inline-block bg-white p-5 rounded-2xl border shadow-lg"
          >
            <QRCodeVue3
              :value="qrValue"
              :size="250"
              level="H"
            />
          </div>

          <!-- Nama -->
          <h2 class="text-2xl font-bold mt-8">
            {{ barang.nama }}
          </h2>

          <!-- Kode -->
          <p class="text-gray-500 text-lg mt-1">
            {{ barang.kode }}
          </p>

          <!-- Divisi -->
          <div class="mt-6">
            <div
              class="bg-slate-50 border rounded-xl py-4 px-5"
            >
              <p class="text-sm text-gray-500">
                Divisi
              </p>

              <p class="text-lg font-bold text-slate-800 mt-1">
                {{ barang.divisi }}
              </p>
            </div>
          </div>

          <!-- Keterangan -->
          <div
            class="mt-8 bg-green-50 border border-green-200 rounded-xl py-4 px-5 text-sm text-green-700"
          >
            Scan QR Code untuk melihat detail inventaris.
          </div>

        </div>

      </div>

      <!-- Tombol Download -->
      <button
        @click="downloadQR"
        class="mt-6 w-full bg-gradient-to-r from-green-700 to-emerald-600 hover:from-green-800 hover:to-emerald-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg transition"
      >
        Download Label Inventaris
      </button>

    </div>

    <!-- Tidak Ditemukan -->
    <div
      v-else
      class="max-w-lg mx-auto bg-white rounded-3xl shadow-xl mt-8 p-10 text-center"
    >

      <h2 class="text-2xl font-bold text-red-600">
        Data Tidak Ditemukan
      </h2>

      <p class="text-gray-500 mt-3">
        Barang sudah dihapus atau QR Code tidak valid.
      </p>

    </div>

  </div>
</template>