<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import * as XLSX from "xlsx";

const inventory = ref([]);
const router = useRouter();
const search = ref("");
const itemsPerPage = ref(10);
const currentPage = ref(1);
const selectedDivisi = ref("");

const divisiDropdownOpen = ref(false);

const pilihDivisi = (divisi) => {
  selectedDivisi.value = divisi;
  divisiDropdownOpen.value = false;
};

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
// Total Nilai Aset
// =======================
const totalNilaiAset = computed(() => {
  return filteredInventory.value.reduce((sum, item) => sum + (Number(item.harga) || 0), 0);
});

const formatRupiah = (angka) => {
  return "Rp " + Number(angka).toLocaleString("id-ID");
};

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
// Pagination
// =======================
const totalPages = computed(() =>
  Math.ceil(filteredInventory.value.length / itemsPerPage.value)
);

const paginatedInventory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + Number(itemsPerPage.value);

  return filteredInventory.value.slice(start, end);
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
// Unduh Excel
// =======================
const downloadExcel = () => {
  if (!filteredInventory.value.length) {
    alert("Tidak ada data untuk diunduh.");
    return;
  }

  const rows = filteredInventory.value.map((item) => ({
    "Kode Barang": item.kode,
    "Nama Barang": item.nama,
    "Divisi": item.divisi,
    "PIC": item.pic || "-",
    "Lokasi": item.lokasi || "-",
    "Harga": item.harga || 0,
    "Status": item.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 18 }, { wch: 28 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventaris");

  const tanggal = new Date().toLocaleDateString("id-ID").replace(/\//g, "-");
  XLSX.writeFile(workbook, `Daftar-Inventaris-Primaland2-${tanggal}.xlsx`);
};

// =======================
// Logout
// =======================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

// =======================
// Saat Halaman Dibuka
// =======================
onMounted(() => {
  loadInventory();
});

watch([search, selectedDivisi, itemsPerPage], () => {
  currentPage.value = 1;
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-emerald-50 p-6">

    <!-- Header -->
    <div
      class="bg-gradient-to-r from-green-700 via-emerald-600 to-teal-500 text-white rounded-3xl p-8 shadow-2xl border border-white/20 flex items-start justify-between gap-4">

      <div>
        <h1 class="text-4xl font-extrabold tracking-wide">
          PRIMALAND 2
        </h1>

        <p class="text-green-100 mt-2 text-lg">
          Inventory Management System
        </p>
      </div>

      <button
        @click="handleLogout"
        class="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Keluar
      </button>
    </div>

    <!-- Judul -->
    <div
      class="mt-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4"
    >
      <h2 class="text-2xl font-bold text-slate-800">
        Daftar Inventaris
      </h2>

<div class="flex gap-3">
        <button
          @click="downloadExcel"
          class="bg-white border border-emerald-600 text-emerald-700 px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-lg hover:bg-emerald-50 hover:scale-105 transition inline-flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Unduh Excel
        </button>

        <RouterLink
          to="/add-inventory"
          class="bg-gradient-to-r from-green-700 via-emerald-600 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-xl hover:scale-105 transition"
        >
          + Tambah Inventaris
        </RouterLink>
      </div>
    </div>

<!-- Search -->
    <div class="mt-6 flex flex-col md:flex-row gap-4">

      <div class="relative flex-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Cari nama atau kode barang..."
          class="w-full pl-12 pr-5 py-3 rounded-2xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
        />
      </div>

<div class="relative md:w-56">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>

        <button
          type="button"
          @click="divisiDropdownOpen = !divisiDropdownOpen"
          class="w-full flex items-center justify-between pl-12 pr-4 py-3 rounded-2xl border bg-white shadow-sm outline-none transition"
          :class="divisiDropdownOpen ? 'border-emerald-500 ring-2 ring-emerald-500' : 'border-slate-200'"
        >
          <span class="text-slate-700 font-medium">{{ selectedDivisi || "Semua Divisi" }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400 transition-transform" :class="divisiDropdownOpen ? 'rotate-180' : ''">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        <div v-if="divisiDropdownOpen" @click="divisiDropdownOpen = false" class="fixed inset-0 z-20"></div>

        <div
          v-if="divisiDropdownOpen"
          class="absolute z-30 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-200 py-2 max-h-64 overflow-auto"
        >
          <button
            type="button"
            @click="pilihDivisi('')"
            class="w-full text-left px-4 py-2.5 text-sm font-medium transition flex items-center justify-between"
            :class="selectedDivisi === '' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'"
          >
            Semua Divisi
            <svg v-if="selectedDivisi === ''" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </button>

          <button
            v-for="divisi in daftarDivisi"
            :key="divisi"
            type="button"
            @click="pilihDivisi(divisi)"
            class="w-full text-left px-4 py-2.5 text-sm font-medium transition flex items-center justify-between"
            :class="selectedDivisi === divisi ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'"
          >
            {{ divisi }}
            <svg v-if="selectedDivisi === divisi" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </div>
      </div>
<select
  v-model="itemsPerPage"
  class="px-5 py-3 rounded-2xl border border-slate-200 bg-white shadow-sm"
>
  <option :value="5">5 Data</option>
  <option :value="10">10 Data</option>
  <option :value="25">25 Data</option>
  <option :value="50">50 Data</option>
  <option :value="100">100 Data</option>
</select>
    </div>

<!-- Total -->
    <div class="mt-6 grid sm:grid-cols-2 gap-4">

      <div class="bg-white rounded-3xl shadow-lg border border-slate-200 border-t-[5px] border-t-emerald-500 p-6 flex items-center gap-5">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-700 via-emerald-600 to-teal-500 flex items-center justify-center shrink-0 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
            <path d="m3.3 7 8.7 5 8.7-5"/>
            <path d="M12 22V12"/>
          </svg>
        </div>
        <div>
          <p class="text-sm text-slate-500 font-medium">Total Barang</p>
          <h2 class="text-4xl font-bold text-slate-800 mt-0.5">
            {{ filteredInventory.length }}
          </h2>
        </div>
      </div>

      <div class="bg-white rounded-3xl shadow-lg border border-slate-200 border-t-[5px] border-t-emerald-500 p-6 flex items-center gap-5">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-700 via-emerald-600 to-teal-500 flex items-center justify-center shrink-0 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="2" x2="12" y2="22"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-sm text-slate-500 font-medium">Total Nilai Aset</p>
          <h2 class="text-2xl sm:text-3xl font-bold text-slate-800 mt-0.5 truncate">
            {{ formatRupiah(totalNilaiAset) }}
          </h2>
        </div>
      </div>

    </div>

    <!-- Card -->
    <div class="grid lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">

<div
  v-for="barang in paginatedInventory"
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