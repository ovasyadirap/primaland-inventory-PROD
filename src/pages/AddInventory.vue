<script setup>
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { supabase } from "../lib/supabase";

const router = useRouter();

const loading = ref(false);

const form = ref({
  kode: "",
  nama: "",
  kategori: "",
  divisi: "",
  tanggal: "",
  qty: 1,
  harga: "",
  status: "Aktif",
  kelengkapan: "",
  foto: "",
});

const simpanData = async () => {
  if (
    !form.value.kode ||
    !form.value.nama ||
    !form.value.divisi
  ) {
    alert("Mohon lengkapi data terlebih dahulu.");
    return;
  }

  loading.value = true;

  const { error } = await supabase
    .from("inventory")
    .insert([
      {
        kode: form.value.kode,
        nama: form.value.nama,
        kategori: form.value.kategori,
        divisi: form.value.divisi,
        tanggal: form.value.tanggal,
        qty: Number(form.value.qty),
        harga: Number(form.value.harga),
        status: form.value.status,
        kelengkapan: form.value.kelengkapan,
        foto: form.value.foto,
      },
    ]);

  loading.value = false;

  if (error) {
    console.error(error);
    alert("Gagal menyimpan data.");
    return;
  }

  alert("Inventaris berhasil ditambahkan!");

  router.push("/");
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
            placeholder="INV-0001"
            class="w-full mt-2 border rounded-xl p-3"
          />
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

        <!-- Kategori -->
        <div>
          <label class="font-semibold">Kategori</label>

          <input
            v-model="form.kategori"
            type="text"
            placeholder="Laptop / Printer / Meja"
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
            placeholder="8500000"
            class="w-full mt-2 border rounded-xl p-3"
          />
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
            class="w-full mt-2 border rounded-xl p-2"
          />
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