<script setup>
import { ref, computed, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { supabase } from "../lib/supabase";

const inventory = ref([]);
const search = ref("");
const selectedDivisi = ref("");

// =======================
// Ambil Data Inventory
// =======================
const loadInventory = async () => {
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error(error);
    alert("Gagal mengambil data.");
    return;
  }

  inventory.value = data;
};

// =======================
// Daftar Divisi
// =======================
const daftarDivisi = computed(() => {
  return [...new Set(inventory.value.map((item) => item.divisi))];
});

// =======================
// Filter Search & Divisi
// =======================
const filteredInventory = computed(() => {
  return inventory.value.filter((item) => {
    const cocokSearch =
      item.nama?.toLowerCase().includes(search.value.toLowerCase()) ||
      item.kode?.toLowerCase().includes(search.value.toLowerCase());

    const cocokDivisi =
      selectedDivisi.value === "" ||
      item.divisi === selectedDivisi.value;

    return cocokSearch && cocokDivisi;
  });
});

// =======================
// Hapus Data
// =======================
const hapusBarang = async (id) => {
  const yakin = confirm("Yakin ingin menghapus inventaris ini?");

  if (!yakin) return;

  const { error } = await supabase
    .from("inventory")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Gagal menghapus data.");
    return;
  }

  alert("Inventaris berhasil dihapus!");

  await loadInventory();
};

// =======================
// Saat Halaman Dibuka
// =======================
onMounted(() => {
  loadInventory();
});
</script>

<template>
  <div class="min-h-screen bg-slate-100 p-6">

    <!-- Header -->
    <div
      class="bg-gradient-to-r from-green-700 to-emerald-600 text-white rounded-3xl p-8 shadow-xl"
    >
      <h1 class="text-3xl font-bold">
        PRIMALAND 2
      </h1>

      <p class="text-green-100 mt-2">
        Inventory Management
      </p>
    </div>

    <!-- Judul -->
    <div
      class="mt-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4"
    >
      <h2 class="text-2xl font-bold text-slate-800">
        Daftar Inventaris
      </h2>

      <RouterLink
        to="/add-inventory"
        class="bg-gradient-to-r from-green-700 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-xl hover:scale-105 transition"
      >
        + Tambah Inventaris
      </RouterLink>
    </div>

    <!-- Search -->
    <div class="mt-6 flex flex-col md:flex-row gap-4">

      <input
        v-model="search"
        type="text"
        placeholder="Cari nama atau kode barang..."
        class="flex-1 px-4 py-3 rounded-xl border border-gray-300 bg-white"
      />

      <select
        v-model="selectedDivisi"
        class="px-4 py-3 rounded-xl border border-gray-300 bg-white"
      >
        <option value="">Semua Divisi</option>

        <option
          v-for="divisi in daftarDivisi"
          :key="divisi"
          :value="divisi"
        >
          {{ divisi }}
        </option>

      </select>

    </div>

    <!-- Total -->
    <div class="mt-6 bg-white rounded-3xl shadow-md p-6">

      <p class="text-gray-500">
        Total Barang
      </p>

      <h2 class="text-4xl font-bold text-green-700 mt-2">
        {{ filteredInventory.length }}
      </h2>

    </div>

    <!-- Card -->
    <div class="grid lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">

      <div
        v-for="barang in filteredInventory"
        :key="barang.id"
        class="bg-white rounded-3xl border border-slate-200 shadow-md p-5"
      >

        <!-- Foto -->
        <div
          v-if="!barang.foto"
          class="w-full h-52 rounded-2xl bg-gray-200 flex items-center justify-center text-gray-500"
        >
          Belum Ada Foto
        </div>

        <img
          v-else
          :src="barang.foto"
          :alt="barang.nama"
          class="w-full h-52 object-cover rounded-2xl"
        >

        <h3 class="text-xl font-bold mt-5">
          {{ barang.nama }}
        </h3>

        <p class="text-gray-500">
          {{ barang.kode }}
        </p>

<div class="mt-5 space-y-4">

  <!-- PIC -->
  <div class="flex items-start gap-3">
    <div>
      <p class="text-xs text-gray-500">👤 PIC</p>
      <p class="font-semibold">
        {{ barang.pic || "-" }}
      </p>
    </div>
  </div>

  <!-- Divisi -->
  <div class="flex items-start gap-3">
    <div>
      <p class="text-xs text-gray-500">🏢 Divisi</p>
      <p class="font-semibold">
        {{ barang.divisi }}
      </p>
    </div>
  </div>

  <!-- Lokasi -->
  <div class="flex items-start gap-3">
    <div>
      <p class="text-xs text-gray-500">📍 Lokasi</p>
      <p class="font-semibold">
        {{ barang.lokasi || "-" }}
      </p>
    </div>
  </div>

  <!-- Status -->
  <div class="pt-2">
    <span
      class="inline-block px-3 py-1 rounded-full text-sm font-semibold"
      :class="{
        'bg-green-100 text-green-700': barang.status === 'Aktif',
        'bg-yellow-100 text-yellow-700': barang.status === 'Maintenance',
        'bg-red-100 text-red-700': barang.status === 'Rusak',
        'bg-gray-200 text-gray-700': barang.status === 'Hilang'
      }"
    >
      {{ barang.status }}
    </span>
  </div>

</div>

        <div class="grid grid-cols-2 gap-3 mt-6">

          <RouterLink
            :to="`/inventory/${barang.kode}`"
            class="text-center bg-blue-600 text-white py-3 rounded-xl"
          >
            Detail
          </RouterLink>

          <RouterLink
            :to="`/edit-inventory/${barang.kode}`"
            class="text-center bg-yellow-500 text-white py-3 rounded-xl"
          >
            Edit
          </RouterLink>

          <button
            @click="hapusBarang(barang.id)"
            class="bg-red-600 text-white py-3 rounded-xl"
          >
            Hapus
          </button>

          <RouterLink
            :to="`/qr/${barang.kode}`"
            class="text-center bg-green-700 text-white py-3 rounded-xl"
          >
            QR Code
          </RouterLink>

        </div>

      </div>

    </div>

  </div>
</template>