<script setup>
import { ref, computed, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { supabase } from "../lib/supabase";
import { bolehKelola } from "../lib/role";

const inventoryTerjual = ref([]);
const loading = ref(true);
const search = ref("");

// =======================
// Ambil Barang Terjual
// =======================
const loadSoldInventory = async () => {
  loading.value = true;

  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("status", "Terjual")
    .order("tanggal_penjualan", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    alert("Gagal mengambil data barang terjual.");
    loading.value = false;
    return;
  }

  inventoryTerjual.value = data || [];
  loading.value = false;
};

// =======================
// Search
// =======================
const filteredInventory = computed(() => {
  const keyword = search.value
    .toLowerCase()
    .trim();

  if (!keyword) {
    return inventoryTerjual.value;
  }

  return inventoryTerjual.value.filter(
    (item) =>
      item.nama
        ?.toLowerCase()
        .includes(keyword) ||
      item.kode
        ?.toLowerCase()
        .includes(keyword) ||
      item.divisi
        ?.toLowerCase()
        .includes(keyword)
  );
});

// =======================
// Summary
// =======================
const totalBarangTerjual = computed(() => {
  return inventoryTerjual.value.length;
});

const totalNilaiPenjualan = computed(() => {
  return inventoryTerjual.value.reduce(
    (total, item) =>
      total +
      (Number(item.harga_jual) || 0),
    0
  );
});

const totalNilaiPerolehan = computed(() => {
  return inventoryTerjual.value.reduce(
    (total, item) =>
      total +
      (Number(item.harga) || 0),
    0
  );
});

// =======================
// Format Rupiah
// =======================
const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(angka) || 0);
};

// =======================
// Format Tanggal
// =======================
const formatTanggal = (tanggal) => {
  if (!tanggal) return "-";

  return new Date(tanggal).toLocaleDateString(
    "id-ID",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
};

onMounted(() => {
  loadSoldInventory();
});
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-emerald-50 p-6"
  >

    <!-- Header -->
    <div
      class="bg-gradient-to-r from-green-700 via-emerald-600 to-teal-500 text-white rounded-3xl p-8 shadow-xl"
    >

      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl mb-5 transition"
      >
        ← Kembali ke Dashboard
      </RouterLink>

      <h1 class="text-3xl font-bold">
        Barang Terjual
      </h1>

      <p class="text-green-100 mt-2">
        Riwayat inventaris yang telah dijual
      </p>

    </div>

    <!-- Summary -->
    <div
      class="grid md:grid-cols-3 gap-4 mt-6"
    >

      <!-- Total Barang Terjual -->
      <div
        class="bg-white rounded-3xl shadow-md border border-slate-200 border-t-[5px] border-t-emerald-500 p-6"
      >
        <p
          class="text-sm text-slate-500 font-medium"
        >
          Total Barang Terjual
        </p>

        <h2
          class="text-3xl font-bold text-slate-800 mt-2"
        >
          {{ totalBarangTerjual }}
        </h2>
      </div>

      <!-- Total Perolehan -->
      <div
        class="bg-white rounded-3xl shadow-md border border-slate-200 border-t-[5px] border-t-slate-500 p-6"
      >
        <p
          class="text-sm text-slate-500 font-medium"
        >
          Total Nilai Perolehan
        </p>

        <h2
          class="text-2xl font-bold text-slate-800 mt-2"
        >
          {{ formatRupiah(totalNilaiPerolehan) }}
        </h2>
      </div>

      <!-- Total Penjualan -->
      <div
        class="bg-white rounded-3xl shadow-md border border-slate-200 border-t-[5px] border-t-emerald-500 p-6"
      >
        <p
          class="text-sm text-slate-500 font-medium"
        >
          Total Nilai Penjualan
        </p>

        <h2
          class="text-2xl font-bold text-emerald-700 mt-2"
        >
          {{ formatRupiah(totalNilaiPenjualan) }}
        </h2>
      </div>

    </div>

    <!-- Search -->
    <div class="mt-6">

      <input
        v-model="search"
        type="text"
        placeholder="Cari nama, kode, atau divisi..."
        class="kotak-isian"
      />

    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="bg-white rounded-3xl shadow-md p-10 text-center mt-6"
    >
      <p
        class="font-semibold text-slate-600"
      >
        Memuat data barang terjual...
      </p>
    </div>

    <!-- Empty -->
    <div
      v-else-if="filteredInventory.length === 0"
      class="bg-white rounded-3xl shadow-md p-10 text-center mt-6"
    >
      <h2
        class="text-xl font-bold text-slate-700"
      >
        Belum Ada Barang Terjual
      </h2>

      <p class="text-slate-500 mt-2">
        Barang yang berstatus Terjual akan muncul di halaman ini.
      </p>
    </div>

    <!-- Cards -->
    <div
      v-else
      class="grid lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6"
    >

      <div
        v-for="barang in filteredInventory"
        :key="barang.id"
        class="bg-white rounded-3xl border border-slate-200 border-t-[5px] border-t-emerald-500 shadow-md hover:shadow-xl transition p-5"
      >

        <!-- Foto -->
        <div
          v-if="!barang.foto"
          class="w-full h-52 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400"
        >
          Belum Ada Foto
        </div>

        <img
          v-else
          :src="barang.foto"
          :alt="barang.nama"
          class="w-full h-52 object-cover rounded-2xl"
        />

        <!-- Nama -->
        <h3
          class="text-xl font-bold text-slate-800 mt-5"
        >
          {{ barang.nama }}
        </h3>

        <!-- Kode -->
        <p
          class="text-xs font-mono text-slate-400 mt-1"
        >
          {{ barang.kode }}
        </p>

        <!-- Status -->
        <div class="mt-3">

          <span
            class="inline-flex px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 text-xs font-bold"
          >
            TERJUAL
          </span>

        </div>

        <!-- Info -->
        <div
          class="border-t border-slate-100 mt-5 pt-4 space-y-3"
        >

          <div>
            <p
              class="text-xs text-slate-400"
            >
              Divisi
            </p>

            <p
              class="font-semibold text-slate-700"
            >
              {{ barang.divisi || "-" }}
            </p>
          </div>

          <div>
            <p
              class="text-xs text-slate-400"
            >
              PIC
            </p>

            <p
              class="font-semibold text-slate-700"
            >
              {{ barang.pic || "-" }}
            </p>
          </div>

          <div>
            <p
              class="text-xs text-slate-400"
            >
              Lokasi
            </p>

            <p
              class="font-semibold text-slate-700"
            >
              {{ barang.lokasi || "-" }}
            </p>
          </div>

          <div>
            <p
              class="text-xs text-slate-400"
            >
              Harga Perolehan
            </p>

            <p
              class="font-semibold text-slate-700"
            >
              {{ formatRupiah(barang.harga) }}
            </p>
          </div>

          <div
            class="bg-emerald-50 rounded-xl p-3"
          >
            <p
              class="text-xs text-slate-500"
            >
              Harga Jual
            </p>

            <p
              class="font-bold text-emerald-700"
            >
              {{ formatRupiah(barang.harga_jual) }}
            </p>
          </div>

          <div>
            <p
              class="text-xs text-slate-400"
            >
              Tanggal Penjualan
            </p>

            <p
              class="font-semibold text-slate-700"
            >
              {{
                formatTanggal(
                  barang.tanggal_penjualan
                )
              }}
            </p>
          </div>

        </div>

        <!-- Actions -->
        <div
          class="grid gap-3 mt-6"
          :class="
            bolehKelola
              ? 'grid-cols-2'
              : 'grid-cols-1'
          "
        >

          <RouterLink
            :to="`/inventory/${barang.kode}`"
            class="text-center bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
          >
            Detail
          </RouterLink>

          <RouterLink
            v-if="bolehKelola"
            :to="`/edit-inventory/${barang.kode}`"
            class="text-center bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition"
          >
            Edit
          </RouterLink>

        </div>

      </div>

    </div>

    <!-- Footer -->
    <footer
      class="mt-12 text-center text-sm text-slate-400"
    >
      © PRIMALAND 2 Inventory Management
    </footer>

  </div>
</template>