<script setup>
import { ref, computed, watch, useId } from "vue";
import { Check, ChevronDown, TriangleAlert } from "lucide-vue-next";
import {
  rapikanTeks,
  cariBaku,
  cariMirip,
  formatBaru,
} from "../lib/kategori";

const props = defineProps({
  modelValue: { type: String, default: "" },

  // Yang sudah ada (sudah tanpa kembaran), jadi saran saat mengetik
  opsi: { type: Array, default: () => [] },

  // Nama isian untuk teks di layar: "divisi", "lokasi", ...
  label: { type: String, default: "pilihan" },
});

const emit = defineEmits(["update:modelValue"]);

const idDaftar = useId();

const kotak = ref(null);

// Daftar saran sedang terbuka
const terbuka = ref(false);

// Dibuka lewat tombol panah: tampilkan semua, tanpa disaring
const semua = ref(false);

// Saran yang sedang disorot panah atas/bawah (-1 = belum ada)
const sorot = ref(-1);

// true selama kotaknya sedang diketik
const sedangMengetik = ref(false);

const labelKapital = computed(
  () => props.label.charAt(0).toUpperCase() + props.label.slice(1)
);

const teks = computed(() => rapikanTeks(props.modelValue));

// Yang diketik ternyata sudah ada (beda huruf besar/kecil atau spasi saja)
const sudahAda = computed(() =>
  cariBaku(props.opsi, props.modelValue)
);

// Hasil akhir yang akan disimpan
const hasil = computed(
  () => sudahAda.value ?? formatBaru(props.modelValue)
);

// Belum ada, tapi mirip dengan yang sudah ada (kemungkinan salah ketik)
const mirip = computed(() =>
  teks.value && !sudahAda.value
    ? cariMirip(props.opsi, teks.value)
    : []
);

// =======================
// Daftar Saran
// =======================
// Yang mengandung huruf yang sedang diketik; yang diawali huruf
// yang sama ditaruh paling atas.
const saran = computed(() => {
  const kunci = semua.value ? "" : teks.value.toLowerCase();

  if (!kunci) return props.opsi;

  const cocok = props.opsi.filter((nilai) =>
    nilai.toLowerCase().includes(kunci)
  );

  return [
    ...cocok.filter((nilai) => nilai.toLowerCase().startsWith(kunci)),
    ...cocok.filter((nilai) => !nilai.toLowerCase().startsWith(kunci)),
  ];
});

// Daftar disembunyikan kalau satu-satunya saran memang yang sedang
// diketik, supaya tidak menutupi petunjuk hijau di bawah kotak.
const tampilkanSaran = computed(
  () =>
    terbuka.value &&
    saran.value.length > 0 &&
    !(saran.value.length === 1 && sudahAda.value === saran.value[0])
);

// Memotong nama jadi 3 bagian, supaya huruf yang cocok bisa ditebalkan
const potong = (nilai) => {
  const kunci = teks.value.toLowerCase();
  const mulai = kunci ? nilai.toLowerCase().indexOf(kunci) : -1;

  if (mulai < 0) return [nilai, "", ""];

  return [
    nilai.slice(0, mulai),
    nilai.slice(mulai, mulai + kunci.length),
    nilai.slice(mulai + kunci.length),
  ];
};

// =======================
// Warna Garis Kotak
// =======================
// Kosong = memakai warna bawaan dari kelas "kotak-isian"
const warnaKotak = computed(() => {
  if (!teks.value) return "";

  if (sudahAda.value) return "border-emerald-400";

  if (mirip.value.length)
    return "border-amber-400 focus:border-amber-500 focus:ring-amber-500/15";

  return "";
});

// =======================
// Buka / Tutup Daftar
// =======================
const buka = () => {
  terbuka.value = true;
  sorot.value = -1;
};

const tutup = () => {
  terbuka.value = false;
  semua.value = false;
  sorot.value = -1;
};

const saatFokus = () => {
  sedangMengetik.value = true;
  buka();
};

// Tombol panah: tampilkan semua pilihan
const bukaSemua = () => {
  kotak.value?.focus();

  semua.value = true;
  buka();
};

const saatKetik = (event) => {
  const nilai = event.target.value;

  // hanya spasi = dianggap kosong
  emit("update:modelValue", rapikanTeks(nilai) === "" ? "" : nilai);

  semua.value = false;
  buka();
};

// Selesai mengetik: tampilkan ejaan akhirnya
// ("MARKOM" -> "Markom", "keuangan" -> "Keuangan")
const saatSelesai = (event) => {
  sedangMengetik.value = false;
  tutup();

  event.target.value = hasil.value;

  if (hasil.value !== props.modelValue) {
    emit("update:modelValue", hasil.value);
  }
};

const pakai = (nilai) => {
  emit("update:modelValue", nilai);
  tutup();

  kotak.value?.focus();
};

// Panah atas/bawah untuk memilih, Enter untuk memakai, Esc untuk menutup
const saatTombol = (event) => {
  if (event.key === "Escape") {
    tutup();
    return;
  }

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();

    if (!terbuka.value) {
      buka();
      return;
    }

    const jumlah = saran.value.length;

    if (!jumlah) return;

    sorot.value =
      event.key === "ArrowDown"
        ? (sorot.value + 1) % jumlah
        : sorot.value <= 0
          ? jumlah - 1
          : sorot.value - 1;

    return;
  }

  if (event.key === "Enter" && terbuka.value && sorot.value >= 0) {
    event.preventDefault();
    pakai(saran.value[sorot.value]);
  }
};

// Isian yang terisi dari luar (misalnya data lama saat Edit) langsung
// disamakan dengan ejaan yang sudah ada. Tidak dilakukan saat sedang diketik.
watch(
  [() => props.modelValue, () => props.opsi],
  () => {
    if (
      !sedangMengetik.value &&
      sudahAda.value &&
      sudahAda.value !== props.modelValue
    ) {
      emit("update:modelValue", sudahAda.value);
    }
  },
  { immediate: true }
);
</script>

<template>
  <div>
    <div class="relative mt-2">
      <input
        ref="kotak"
        :value="modelValue"
        type="text"
        spellcheck="false"
        autocomplete="off"
        role="combobox"
        :aria-expanded="terbuka"
        :aria-controls="idDaftar"
        :placeholder="`Ketik atau pilih ${label}`"
        class="kotak-isian pr-11"
        :class="warnaKotak"
        @input="saatKetik"
        @focus="saatFokus"
        @blur="saatSelesai"
        @keydown="saatTombol"
      />

      <!-- Tombol buka daftar -->
      <button
        v-if="opsi.length"
        type="button"
        :aria-label="`Lihat daftar ${label}`"
        class="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600"
        @mousedown.prevent
        @click="tampilkanSaran ? tutup() : bukaSemua()"
      >
        <ChevronDown
          class="w-5 h-5 transition-transform"
          :class="tampilkanSaran && 'rotate-180'"
        />
      </button>

      <!-- Daftar saran -->
      <ul
        v-if="tampilkanSaran"
        :id="idDaftar"
        role="listbox"
        class="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-auto bg-white border border-slate-200 rounded-xl shadow-xl py-1"
      >
        <li
          v-for="(nilai, urutan) in saran"
          :key="nilai"
          role="option"
          :aria-selected="urutan === sorot"
          class="px-3 py-2 cursor-pointer flex items-center justify-between gap-2"
          :class="
            urutan === sorot
              ? 'bg-slate-100'
              : 'hover:bg-slate-50'
          "
          @mousedown.prevent="pakai(nilai)"
          @mousemove="sorot = urutan"
        >
          <span class="text-slate-700">
            <template v-for="(bagian, nomor) in potong(nilai)" :key="nomor">
              <b
                v-if="nomor === 1 && bagian"
                class="text-slate-900"
              >{{ bagian }}</b>

              <template v-else>{{ bagian }}</template>
            </template>
          </span>

          <Check
            v-if="sudahAda === nilai"
            class="w-4 h-4 text-emerald-600 shrink-0"
          />
        </li>
      </ul>
    </div>

    <!-- Sudah ada, tapi ditulis beda huruf besar/kecil -->
    <p
      v-if="teks && sudahAda && sudahAda !== teks"
      class="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5 mt-2"
    >
      <Check class="w-3.5 h-3.5 shrink-0" />
      Dikenali sebagai "{{ sudahAda }}", jadi disimpan sebagai itu.
    </p>

    <!-- Sudah ada -->
    <p
      v-else-if="teks && sudahAda"
      class="flex items-center gap-1.5 text-xs font-medium text-emerald-700 mt-2"
    >
      <Check class="w-3.5 h-3.5 shrink-0" />
      {{ labelKapital }} sudah ada.
    </p>

    <!-- Belum ada -->
    <div
      v-else-if="teks"
      class="mt-2"
    >
      <div
        v-if="mirip.length"
        class="flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5"
      >
        <TriangleAlert class="w-3.5 h-3.5 shrink-0 mt-px" />

        <p>
          Mirip dengan
          <template
            v-for="(nilai, urutan) in mirip"
            :key="nilai"
          >
            <button
              type="button"
              class="font-semibold underline underline-offset-2 hover:text-amber-900"
              @mousedown.prevent="pakai(nilai)"
            >
              "{{ nilai }}"
            </button>
            <span v-if="urutan < mirip.length - 1">, </span>
          </template>
          — salah ketik? Klik namanya untuk memakai yang sudah ada.
        </p>
      </div>

      <p
        class="text-xs text-slate-500"
        :class="mirip.length && 'mt-1.5'"
      >
        {{ labelKapital }} baru, akan disimpan sebagai:
        <b class="text-slate-700">{{ hasil }}</b>
      </p>
    </div>
  </div>
</template>