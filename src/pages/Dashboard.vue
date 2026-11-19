<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import * as XLSX from "xlsx";
import { hitungNilaiSekarang } from "../lib/penyusutan";
import { bolehKelola, isViewer } from "../lib/role";
import { gabungkanNilai, rapikanTeks } from "../lib/kategori";
import PilihanDropdown from "../components/PilihanDropdown.vue";

// Dua tulisan dianggap sama walau beda huruf besar/kecil atau spasi
// ("MARKOM" = "Markom")
const samaTeks = (a, b) =>
  rapikanTeks(a).toLowerCase() === rapikanTeks(b).toLowerCase();

const inventory = ref([]);
const router = useRouter();

const search = ref("");
const itemsPerPage = ref(10);
const currentPage = ref(1);

const selectedDivisi = ref("");
const selectedLokasi = ref("");
const selectedStatus = ref("");

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

  inventory.value = data || [];
};

// =======================
// Inventory Aktif
// Barang Terjual Dipisahkan
// =======================
const activeInventory = computed(() => {
  return inventory.value.filter(
    (item) => item.status !== "Terjual"
  );
});

// =======================
// Total Barang Terjual
// =======================
const jumlahTerjual = computed(() => {
  return inventory.value.filter(
    (item) => item.status === "Terjual"
  ).length;
});

// =======================
// Daftar Divisi
// =======================
// Divisi yang hanya beda huruf besar/kecil digabung jadi satu pilihan
const daftarDivisi = computed(() =>
  gabungkanNilai(
    activeInventory.value.map((item) => item.divisi)
  )
);

// =======================
// Daftar Lokasi
// =======================
// Lokasi yang hanya beda huruf besar/kecil digabung jadi satu pilihan
const daftarLokasi = computed(() =>
  gabungkanNilai(
    activeInventory.value.map((item) => item.lokasi)
  )
);

// =======================
// Isi Dropdown Filter
// =======================
const opsiDivisi = computed(() => [
  { nilai: "", teks: "Semua Divisi" },
  ...daftarDivisi.value.map((nama) => ({
    nilai: nama,
    teks: nama,
  })),
]);

const opsiLokasi = computed(() => [
  { nilai: "", teks: "Semua Lokasi" },
  ...daftarLokasi.value.map((nama) => ({
    nilai: nama,
    teks: nama,
  })),
]);

const opsiStatus = [
  { nilai: "", teks: "Semua Status" },
  { nilai: "Aktif", teks: "Aktif" },
  { nilai: "Maintenance", teks: "Maintenance" },
  { nilai: "Rusak", teks: "Rusak" },
  { nilai: "Hilang", teks: "Hilang" },
];

const opsiJumlah = [5, 10, 25, 50, 100].map((jumlah) => ({
  nilai: jumlah,
  teks: `${jumlah} Data`,
}));

// =======================
// Filter Search, Divisi,
// Lokasi & Status
// =======================
const filteredInventory = computed(() => {
  const keyword = search.value
    .toLowerCase()
    .trim();

  return activeInventory.value.filter((item) => {
    const cocokSearch =
      item.nama
        ?.toLowerCase()
        .includes(keyword) ||
      item.kode
        ?.toLowerCase()
        .includes(keyword) ||
      item.pic
        ?.toLowerCase()
        .includes(keyword);

    // Dicocokkan tanpa membedakan huruf besar/kecil, supaya barang
    // berdivisi "MARKOM" ikut muncul saat memilih "Markom"
    const cocokDivisi =
      selectedDivisi.value === "" ||
      samaTeks(item.divisi, selectedDivisi.value);

    const cocokLokasi =
      selectedLokasi.value === "" ||
      samaTeks(item.lokasi, selectedLokasi.value);

    const cocokStatus =
      selectedStatus.value === "" ||
      item.status === selectedStatus.value;

    return (
      cocokSearch &&
      cocokDivisi &&
      cocokLokasi &&
      cocokStatus
    );
  });
});

// =======================
// Total Nilai Perolehan
// =======================
const totalNilaiAset = computed(() => {
  return filteredInventory.value.reduce(
    (sum, item) =>
      sum + (Number(item.harga) || 0),
    0
  );
});

// =======================
// Format Rupiah
// =======================
const formatRupiah = (angka) => {
  return (
    "Rp " +
    Number(angka || 0).toLocaleString("id-ID")
  );
};

// =======================
// Total Nilai Buku Saat Ini
// =======================
const totalNilaiSekarang = computed(() => {
  return filteredInventory.value.reduce(
    (sum, item) =>
      sum +
      hitungNilaiSekarang(
        item.harga,
        item.tanggal,
        item.masa_manfaat,
        item.nilai_residu
      ),
    0
  );
});

// =======================
// Pagination
// =======================
const totalPages = computed(() =>
  Math.ceil(
    filteredInventory.value.length /
      itemsPerPage.value
  )
);

const paginatedInventory = computed(() => {
  const start =
    (currentPage.value - 1) *
    itemsPerPage.value;

  const end =
    start + Number(itemsPerPage.value);

  return filteredInventory.value.slice(
    start,
    end
  );
});

// =======================
// Hapus Data
// =======================
const hapusBarang = async (id) => {
  const yakin = confirm(
    "Yakin ingin menghapus inventaris ini?"
  );

  if (!yakin) return;

  const { data, error } = await supabase
    .from("inventory")
    .delete()
    .eq("id", id)
    .select();

  // Kalau diblokir aturan RLS, Supabase tidak kasih error,
  // hanya mengembalikan 0 baris — jadi dicek juga di sini
  if (error || !data || data.length === 0) {
    console.error(
      error || "Penghapusan diblokir: tidak ada baris yang terhapus"
    );
    alert("Gagal menghapus data. Akun ini tidak punya izin hapus.");
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

  // =======================
  // Detail Inventory
  // =======================
  const rows = filteredInventory.value.map(
    (item) => ({
      "Kode Barang": item.kode,
      "Nama Barang": item.nama,
      "Divisi": item.divisi,
      "PIC": item.pic || "-",
      "Lokasi": item.lokasi || "-",

      "Tanggal Pengadaan": item.tanggal
        ? new Date(
            item.tanggal
          ).toLocaleDateString("id-ID")
        : "-",

      "Harga Perolehan":
        Number(item.harga) || 0,

      "Persentase Residu":
        item.persentase_residu !== null &&
        item.persentase_residu !== undefined
          ? `${item.persentase_residu}%`
          : "-",

      "Nilai Residu":
        Number(item.nilai_residu) || 0,

      "Masa Manfaat (Tahun)":
        item.masa_manfaat || "-",

      "Nilai Buku Saat Ini":
        hitungNilaiSekarang(
          item.harga,
          item.tanggal,
          item.masa_manfaat,
          item.nilai_residu
        ),

      "Status": item.status,
    })
  );

  // =======================
  // Worksheet Detail
  // =======================
  const worksheet =
    XLSX.utils.json_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 24 }, // Kode
    { wch: 30 }, // Nama
    { wch: 18 }, // Divisi
    { wch: 20 }, // PIC
    { wch: 25 }, // Lokasi
    { wch: 20 }, // Tanggal
    { wch: 20 }, // Harga
    { wch: 20 }, // Persentase
    { wch: 20 }, // Residu
    { wch: 22 }, // Masa Manfaat
    { wch: 22 }, // Nilai Buku
    { wch: 15 }, // Status
  ];

  // Format angka nominal
  for (
    let row = 2;
    row <= rows.length + 1;
    row++
  ) {
    // Harga Perolehan
    if (worksheet[`G${row}`]) {
      worksheet[`G${row}`].z = "#,##0";
    }

    // Nilai Residu
    if (worksheet[`I${row}`]) {
      worksheet[`I${row}`].z = "#,##0";
    }

    // Nilai Buku
    if (worksheet[`K${row}`]) {
      worksheet[`K${row}`].z = "#,##0";
    }
  }

  // =======================
  // Hitung Summary
  // =======================
  const totalBarang =
    filteredInventory.value.length;

  const totalNilaiPerolehan =
    filteredInventory.value.reduce(
      (total, item) =>
        total +
        (Number(item.harga) || 0),
      0
    );

  const totalNilaiResidu =
    filteredInventory.value.reduce(
      (total, item) =>
        total +
        (Number(item.nilai_residu) || 0),
      0
    );

  const totalNilaiBuku =
    filteredInventory.value.reduce(
      (total, item) =>
        total +
        hitungNilaiSekarang(
          item.harga,
          item.tanggal,
          item.masa_manfaat,
          item.nilai_residu
        ),
      0
    );

  // =======================
  // Summary Excel
  // =======================
  const summaryData = [
    [
      "RINGKASAN INVENTARIS PRIMALAND 2",
      "",
    ],

    [
      "Tanggal Laporan",
      new Date().toLocaleDateString("id-ID"),
    ],

    [
      "Filter Divisi",
      selectedDivisi.value ||
        "Semua Divisi",
    ],

    [
      "Filter Lokasi",
      selectedLokasi.value ||
        "Semua Lokasi",
    ],

    [
      "Filter Status",
      selectedStatus.value ||
        "Semua Status",
    ],

    [
      "Pencarian",
      search.value || "-",
    ],

    ["", ""],

    [
      "Total Barang",
      totalBarang,
    ],

    [
      "Total Nilai Perolehan",
      totalNilaiPerolehan,
    ],

    [
      "Total Nilai Residu",
      totalNilaiResidu,
    ],

    [
      "Total Nilai Buku Saat Ini",
      totalNilaiBuku,
    ],
  ];

  const summarySheet =
    XLSX.utils.aoa_to_sheet(summaryData);

  summarySheet["!cols"] = [
    { wch: 30 },
    { wch: 30 },
  ];

  // =======================
  // Format Summary
  // =======================
  // B8 = Total Barang
  // B9 = Nilai Perolehan
  // B10 = Nilai Residu
  // B11 = Nilai Buku

  if (summarySheet["B9"]) {
    summarySheet["B9"].z = "#,##0";
  }

  if (summarySheet["B10"]) {
    summarySheet["B10"].z = "#,##0";
  }

  if (summarySheet["B11"]) {
    summarySheet["B11"].z = "#,##0";
  }

  // =======================
  // Workbook
  // =======================
  const workbook =
    XLSX.utils.book_new();

  // Summary sheet pertama
  XLSX.utils.book_append_sheet(
    workbook,
    summarySheet,
    "Summary"
  );

  // Detail sheet kedua
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Inventaris Aktif"
  );

  // =======================
  // Nama File
  // =======================
  const tanggal =
    new Date()
      .toLocaleDateString("id-ID")
      .replace(/\//g, "-");

  XLSX.writeFile(
    workbook,
    `Daftar-Inventaris-Primaland2-${tanggal}.xlsx`
  );
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

// =======================
// Reset Pagination
// =======================
watch(
  [
    search,
    selectedDivisi,
    selectedLokasi,
    selectedStatus,
    itemsPerPage,
  ],
  () => {
    currentPage.value = 1;
  }
);
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-emerald-50 p-6"
  >

    <!-- ===================== -->
    <!-- Header -->
    <!-- ===================== -->
    <div
      class="bg-gradient-to-r from-green-700 via-emerald-600 to-teal-500 text-white rounded-3xl p-8 shadow-2xl border border-white/20 flex items-start justify-between gap-4"
    >

      <div>
        <h1
          class="text-4xl font-extrabold tracking-wide"
        >
          PRIMALAND 2
        </h1>

        <p
          class="text-green-100 mt-2 text-lg"
        >
          Inventory Management System
        </p>

        <!-- Penanda akun direktur (view-only) -->
        <span
          v-if="isViewer"
          class="inline-flex items-center gap-1.5 mt-3 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>

          Mode Lihat Saja
        </span>
      </div>

      <button
        @click="handleLogout"
        class="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shrink-0"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
          />

          <polyline
            points="16 17 21 12 16 7"
          />

          <line
            x1="21"
            y1="12"
            x2="9"
            y2="12"
          />
        </svg>

        Keluar
      </button>

    </div>

    <!-- ===================== -->
    <!-- Judul -->
    <!-- ===================== -->
    <div
      class="mt-8 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4"
    >

      <h2
        class="text-2xl font-bold text-slate-800"
      >
        Daftar Inventaris
      </h2>

      <!-- Actions -->
      <div
        class="flex flex-col sm:flex-row gap-3"
      >

        <!-- Barang Terjual -->
        <RouterLink
          to="/sold-inventory"
          class="bg-white border border-slate-300 text-slate-700 px-5 py-3 rounded-xl font-semibold shadow-sm hover:shadow-lg hover:bg-slate-50 transition inline-flex items-center justify-center gap-2"
        >

          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v5" />
            <path d="M14 11v5" />
          </svg>

          Barang Terjual

          <span
            v-if="jumlahTerjual > 0"
            class="bg-slate-700 text-white text-xs font-bold min-w-6 h-6 px-1.5 rounded-full flex items-center justify-center"
          >
            {{ jumlahTerjual }}
          </span>

        </RouterLink>

        <!-- Unduh Excel -->
        <button
          @click="downloadExcel"
          class="bg-white border border-emerald-600 text-emerald-700 px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-lg hover:bg-emerald-50 hover:scale-105 transition inline-flex items-center justify-center gap-2"
        >

          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
            />

            <polyline
              points="7 10 12 15 17 10"
            />

            <line
              x1="12"
              y1="15"
              x2="12"
              y2="3"
            />
          </svg>

          Unduh Excel
        </button>

        <!-- Tambah -->
        <RouterLink
          v-if="bolehKelola"
          to="/add-inventory"
          class="bg-gradient-to-r from-green-700 via-emerald-600 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-xl hover:scale-105 transition text-center"
        >
          + Tambah Inventaris
        </RouterLink>

      </div>

    </div>

    <!-- ===================== -->
    <!-- Search & Filter -->
    <!-- ===================== -->
    <div
      class="mt-6 flex flex-col xl:flex-row gap-4"
    >

      <!-- Search -->
      <div class="relative flex-1">

        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        >
          <circle
            cx="11"
            cy="11"
            r="8"
          />

          <line
            x1="21"
            y1="21"
            x2="16.65"
            y2="16.65"
          />
        </svg>

        <input
          v-model="search"
          type="text"
          placeholder="Cari nama, kode barang, atau PIC..."
          class="kotak-isian pl-12"
        />

      </div>

      <div
        class="flex flex-col sm:flex-row gap-4"
      >

        <!-- ===================== -->
        <!-- Divisi -->
        <!-- ===================== -->
        <PilihanDropdown
          v-model="selectedDivisi"
          :opsi="opsiDivisi"
          class="sm:w-52"
        >
          <template #ikon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polygon
                points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
              />
            </svg>
          </template>
        </PilihanDropdown>

        <!-- ===================== -->
        <!-- Lokasi -->
        <!-- ===================== -->
        <PilihanDropdown
          v-model="selectedLokasi"
          :opsi="opsiLokasi"
          class="sm:w-44"
        >
          <template #ikon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
              />

              <circle
                cx="12"
                cy="10"
                r="3"
              />
            </svg>
          </template>
        </PilihanDropdown>

        <!-- ===================== -->
        <!-- Status -->
        <!-- ===================== -->
        <PilihanDropdown
          v-model="selectedStatus"
          :opsi="opsiStatus"
          class="sm:w-44"
        />

        <!-- ===================== -->
        <!-- Jumlah Data -->
        <!-- ===================== -->
        <PilihanDropdown
          v-model="itemsPerPage"
          :opsi="opsiJumlah"
          class="sm:w-32"
        />

      </div>
    </div>

    <!-- ===================== -->
    <!-- Summary Dashboard -->
    <!-- ===================== -->
    <div
      class="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >

      <!-- Total Barang -->
      <div
        class="bg-white rounded-3xl shadow-lg border border-slate-200 border-t-[5px] border-t-emerald-500 p-6 flex items-center gap-5"
      >

        <div
          class="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-700 via-emerald-600 to-teal-500 flex items-center justify-center shrink-0 shadow-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
            />

            <path
              d="m3.3 7 8.7 5 8.7-5"
            />

            <path
              d="M12 22V12"
            />
          </svg>
        </div>

        <div>
          <p
            class="text-sm text-slate-500 font-medium"
          >
            Total Barang
          </p>

          <h2
            class="text-4xl font-bold text-slate-800 mt-0.5"
          >
            {{ filteredInventory.length }}
          </h2>
        </div>

      </div>

      <!-- Nilai Perolehan -->
      <div
        class="bg-white rounded-3xl shadow-lg border border-slate-200 border-t-[5px] border-t-emerald-500 p-6 flex items-center gap-5"
      >

        <div
          class="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-700 via-emerald-600 to-teal-500 flex items-center justify-center shrink-0 shadow-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line
              x1="12"
              y1="2"
              x2="12"
              y2="22"
            />

            <path
              d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
            />
          </svg>
        </div>

        <div class="min-w-0">

          <p
            class="text-sm text-slate-500 font-medium"
          >
            Nilai Perolehan
          </p>

          <h2
            class="text-2xl sm:text-3xl font-bold text-slate-800 mt-0.5"
          >
            {{ formatRupiah(totalNilaiAset) }}
          </h2>

        </div>

      </div>

      <!-- Nilai Buku -->
      <div
        class="bg-white rounded-3xl shadow-lg border border-slate-200 border-t-[5px] border-t-indigo-500 p-6 flex items-center gap-5"
      >

        <div
          class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center shrink-0 shadow-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M3 3v18h18"
            />

            <path
              d="m19 9-5 5-4-4-3 3"
            />
          </svg>
        </div>

        <div class="min-w-0">

          <p
            class="text-sm text-slate-500 font-medium"
          >
            Nilai Buku Saat Ini
          </p>

          <h2
            class="text-2xl sm:text-3xl font-bold text-slate-800 mt-0.5"
          >
            {{
              formatRupiah(
                totalNilaiSekarang
              )
            }}
          </h2>

        </div>

      </div>

    </div>

    <!-- ===================== -->
    <!-- Card Inventory -->
    <!-- ===================== -->
    <div
      class="grid lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6"
    >

      <div
        v-for="barang in paginatedInventory"
        :key="barang.id"
        class="bg-white rounded-3xl border border-slate-200 border-t-[5px] border-t-emerald-500 shadow-md hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 ease-in-out p-5"
      >

        <!-- Foto Kosong -->
        <div
          v-if="!barang.foto"
          class="w-full h-52 rounded-xl bg-slate-100 flex flex-col items-center justify-center gap-2 text-slate-400"
        >

          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
            />

            <circle
              cx="9"
              cy="9"
              r="2"
            />

            <path
              d="m21 15-5-5L5 21"
            />
          </svg>

          <span
            class="text-xs font-medium"
          >
            Belum ada foto
          </span>

        </div>

        <!-- Foto -->
        <img
          v-else
          :src="barang.foto"
          :alt="barang.nama"
          class="w-full h-52 object-cover rounded-2xl shadow-md"
        />

        <!-- Nama -->
        <h3
          class="text-lg font-bold text-slate-800 mt-4"
        >
          {{ barang.nama }}
        </h3>

        <!-- Kode -->
        <p
          class="text-xs font-mono text-slate-400 tracking-wide mt-0.5"
        >
          {{ barang.kode }}
        </p>

        <!-- Info -->
        <div
          class="mt-4 space-y-3 border-t border-slate-100 pt-4"
        >

          <!-- PIC -->
          <div
            class="flex items-center gap-3"
          >

            <span
              class="w-8 h-8 rounded-full bg-violet-50 text-violet-500 flex items-center justify-center shrink-0"
            >

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                />

                <circle
                  cx="12"
                  cy="7"
                  r="4"
                />
              </svg>

            </span>

            <div class="min-w-0">

              <p
                class="text-[11px] text-slate-400 font-medium leading-tight"
              >
                PIC
              </p>

              <p
                class="text-sm font-semibold text-slate-700 truncate"
              >
                {{ barang.pic || "-" }}
              </p>

            </div>

          </div>

          <!-- Divisi -->
          <div
            class="flex items-center gap-3"
          >

            <span
              class="w-8 h-8 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center shrink-0"
            >

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect
                  x="4"
                  y="2"
                  width="16"
                  height="20"
                  rx="1"
                />

                <path
                  d="M9 22v-4h6v4"
                />

                <path
                  d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"
                />
              </svg>

            </span>

            <div class="min-w-0">

              <p
                class="text-[11px] text-slate-400 font-medium leading-tight"
              >
                Divisi
              </p>

              <span
                class="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-xs font-semibold"
              >
                {{ barang.divisi }}
              </span>

            </div>

          </div>

          <!-- Lokasi -->
          <div
            class="flex items-center gap-3"
          >

            <span
              class="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0"
            >

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
                />

                <circle
                  cx="12"
                  cy="10"
                  r="3"
                />
              </svg>

            </span>

            <div class="min-w-0">

              <p
                class="text-[11px] text-slate-400 font-medium leading-tight"
              >
                Lokasi
              </p>

              <p
                class="text-sm font-semibold text-slate-700 truncate"
              >
                {{ barang.lokasi || "-" }}
              </p>

            </div>

          </div>

        </div>

        <!-- Divider -->
        <div
          class="border-t border-dashed border-slate-200 my-5"
        ></div>

        <!-- Status -->
        <div class="mt-4">

          <span
            class="inline-block px-3 py-1 rounded-full text-xs font-semibold"
            :class="{
              'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200':
                barang.status === 'Aktif',

              'bg-amber-50 text-amber-700 ring-1 ring-amber-200':
                barang.status === 'Maintenance',

              'bg-red-50 text-red-600 ring-1 ring-red-200':
                barang.status === 'Rusak',

              'bg-slate-100 text-slate-500 ring-1 ring-slate-200':
                barang.status === 'Hilang'
            }"
          >
            {{ barang.status }}
          </span>

        </div>

        <!-- Actions -->
        <div
          class="grid grid-cols-2 gap-2.5 mt-5"
        >

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
            v-if="bolehKelola"
            :to="`/edit-inventory/${barang.kode}`"
            class="text-center bg-slate-100 text-slate-600 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
          >
            Edit
          </RouterLink>

          <button
            v-if="bolehKelola"
            @click="hapusBarang(barang.id)"
            class="text-center bg-white text-red-500 py-2.5 rounded-lg text-sm font-semibold border border-red-100 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            Hapus
          </button>

        </div>

      </div>

    </div>

    <!-- ===================== -->
    <!-- Pagination -->
    <!-- ===================== -->
    <div
      v-if="totalPages > 1"
      class="flex items-center justify-center gap-3 mt-8"
    >

      <button
        @click="currentPage--"
        :disabled="currentPage === 1"
        class="px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
      >
        ← Sebelumnya
      </button>

      <span
        class="text-sm font-semibold text-slate-600"
      >
        Halaman {{ currentPage }}
        dari {{ totalPages }}
      </span>

      <button
        @click="currentPage++"
        :disabled="
          currentPage === totalPages
        "
        class="px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
      >
        Selanjutnya →
      </button>

    </div>

    <!-- Footer -->
    <footer
      class="mt-12 text-center text-sm text-slate-400"
    >
      © PRIMALAND 2 Inventory Management
    </footer>

  </div>
</template>