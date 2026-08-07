<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { supabase } from "../lib/supabase";
import { v4 as uuidv4 } from "uuid";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const selectedFile = ref(null);
const previewFoto = ref("");

const form = ref({
  kode: "",
  nama: "",
  divisi: "",
  pic: "",
  lokasi: "",
  tanggal: "",
  qty: 1,
  harga: "",
  status: "Aktif",
  kelengkapan: "",
  foto: "",
});

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
    console.error(error);
    alert("Data tidak ditemukan.");
    router.push("/");
    return;
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
  status: data.status,
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
  loading.value = true;

  let fotoURL = form.value.foto;

  // Upload foto jika user memilih file baru
  if (selectedFile.value) {
    const file = selectedFile.value;

    const fileExt = file.name.split(".").pop();

    const fileName = `${uuidv4()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("inventory")
      .upload(fileName, file, {
        upsert: true,
      });

    if (uploadError) {
      loading.value = false;
      console.error(uploadError);
      alert(uploadError.message);
      return;
    }

    const { data } = supabase.storage
      .from("inventory")
      .getPublicUrl(fileName);

    fotoURL = data.publicUrl;
  }

  const { error } = await supabase
    .from("inventory")
    .update({
      nama: form.value.nama,
      divisi: form.value.divisi,
      pic: form.value.pic,
      lokasi: form.value.lokasi,
      tanggal: form.value.tanggal,
      qty: Number(form.value.qty),
      harga: Number(form.value.harga),
      status: form.value.status,
      kelengkapan: form.value.kelengkapan,
      foto: fotoURL,
    })
    .eq("kode", form.value.kode);

  loading.value = false;

  if (error) {
    console.error(error);
    alert("Gagal mengubah data.");
    return;
  }

  alert("Inventaris berhasil diperbarui!");

  router.push("/");
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
    <div class="bg-white rounded-3xl shadow-lg p-6 mt-6">

      <div class="grid md:grid-cols-2 gap-5">

        <div>
          <label class="font-semibold">Kode Barang</label>

          <input
            v-model="form.kode"
            readonly
            class="w-full mt-2 border rounded-xl p-3 bg-gray-100"
          />
        </div>

        <div>
          <label class="font-semibold">Nama Barang</label>

          <input
            v-model="form.nama"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        

        <div>
          <label class="font-semibold">Divisi</label>

          <input
            v-model="form.divisi"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <div>
          <label class="font-semibold">PIC</label>

          <input
            v-model="form.pic"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <div>
          <label class="font-semibold">Lokasi</label>

          <input
            v-model="form.lokasi"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <div>
          <label class="font-semibold">Tanggal Pengadaan</label>

          <input
            v-model="form.tanggal"
            type="date"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <div>
          <label class="font-semibold">Qty</label>

          <input
            v-model="form.qty"
            type="number"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <div>
          <label class="font-semibold">Harga</label>

          <input
            v-model="form.harga"
            type="number"
            class="w-full mt-2 border rounded-xl p-3"
          />
        </div>

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

        <div>
          <label class="font-semibold">Foto Barang</label>

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
        <label class="font-semibold block mb-2">
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
          {{ loading ? "Menyimpan..." : "Simpan Perubahan" }}
        </button>

      </div>

    </div>

  </div>
</template>