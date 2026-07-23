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
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-emerald-50 p-6">

    <!-- Header -->
    <div
      class="bg-gradient-to-r from-green-700 via-emerald-600 to-teal-500 text-white rounded-3xl p-8 shadow-2xl border border-white/20">

      <h1 class="text-4xl font-extrabold tracking-wide">
        PRIMALAND 2
      </h1>

      <p class="text-green-100 mt-2 text-lg">
        Inventory Management System
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
        class="flex-1 px-5 py-3 rounded-2xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
      />

      <select
        v-model="selectedDivisi"
        class="px-5 py-3 rounded-2xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
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
    <div class="mt-6 bg-white rounded-3xl shadow-lg border border-slate-200 p-6">

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
  class="bg-white rounded-3xl border border-slate-200 border-t-[5px] border-t-emerald-500 shadow-md hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 ease-in-out p-5"
>

  <!-- Foto -->
  <div
    v-if="!barang.foto"
    class="w-full h-52 rounded-xl bg-slate-100 flex flex-col items-center justify-center gap-2 text-slate-400"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
    <span class="text-xs font-medium">Belum ada foto</span>
  </div>

  <img
    v-else
    :src="barang.foto"
    :alt="barang.nama"
    class="w-full h-52 object-cover rounded-2xl shadow-md"
  >

  <h3 class="text-lg font-bold text-slate-800 mt-4">
    {{ barang.nama }}
  </h3>

  <p class="text-xs font-mono text-slate-400 tracking-wide mt-0.5">
    {{ barang.kode }}
  </p>

  <div class="mt-3">

  <span
    class="inline-flex items-center bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold"
  >
    {{ barang.kategori || "Inventaris" }}
  </span>

</div>

  <!-- Info -->
  <div class="mt-4 space-y-3 border-t border-slate-100 pt-4">

    <div class="flex items-center gap-3">
      <span class="w-8 h-8 rounded-full bg-violet-50 text-violet-500 flex items-center justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </span>
      <div class="min-w-0">
        <p class="text-[11px] text-slate-400 font-medium leading-tight">PIC</p>
        <p class="text-sm font-semibold text-slate-700 truncate">{{ barang.pic || "-" }}</p>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <span class="w-8 h-8 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></svg>
      </span>
      <div class="min-w-0">
        <p class="text-[11px] text-slate-400 font-medium leading-tight">Divisi</p>
        <span class="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-xs font-semibold">{{ barang.divisi }}</span>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <span class="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </span>
      <div class="min-w-0">
        <p class="text-[11px] text-slate-400 font-medium leading-tight">Lokasi</p>
        <p class="text-sm font-semibold text-slate-700 truncate">{{ barang.lokasi || "-" }}</p>
      </div>
    </div>

  </div>

  <!-- Status -->
  <div class="border-t border-dashed border-slate-200 my-5"></div>
  <div class="mt-4">
    <span
      class="inline-block px-3 py-1 rounded-full text-xs font-semibold"
      :class="{
        'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200': barang.status === 'Aktif',
        'bg-amber-50 text-amber-700 ring-1 ring-amber-200': barang.status === 'Maintenance',
        'bg-red-50 text-red-600 ring-1 ring-red-200': barang.status === 'Rusak',
        'bg-slate-100 text-slate-500 ring-1 ring-slate-200': barang.status === 'Hilang'
      }"
    >
      {{ barang.status }}
    </span>
  </div>

  <!-- Actions -->
  <div class="grid grid-cols-2 gap-2.5 mt-5">

    <RouterLink
      :to="`/inventory/${barang.kode}`"
      class="text-center bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold shadow hover:shadow-lg hover:bg-emerald-700 transition-all hover:-translate-y-0.5"
    >
      Detail
    </RouterLink>

    <RouterLink
      :to="`/qr/${barang.kode}`"
      class="text-center bg-emerald-50 text-emerald-700 py-2.5 rounded-lg text-sm font-semibold border border-emerald-200 hover:bg-emerald-100 transition-colors"
    >
      QR Code
    </RouterLink>

    <RouterLink
      :to="`/edit-inventory/${barang.kode}`"
      class="text-center bg-slate-100 text-slate-600 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
    >
      Edit
    </RouterLink>

    <button
      @click="hapusBarang(barang.id)"
      class="text-center bg-white text-red-500 py-2.5 rounded-lg text-sm font-semibold border border-red-100 hover:bg-red-50 hover:text-red-600 transition-colors"
    >
      Hapus
    </button>

  </div>

</div>

    </div>
    <footer class="mt-12 text-center text-sm text-slate-400">

      © PRIMALAND 2 Inventory Management

    </footer>
  </div>
</template>