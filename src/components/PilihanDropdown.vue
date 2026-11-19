<script setup>
import { ref, computed, useSlots } from "vue";
import { Check, ChevronDown } from "lucide-vue-next";

// =======================
// Pilihan Dropdown
// =======================
// Dropdown buatan sendiri, dipakai semua filter di Dashboard supaya
// tampilannya seragam. (Dropdown bawaan browser tidak bisa diatur
// tampilannya, jadi tidak dipakai lagi.)
//
// Contoh:
//   <PilihanDropdown
//     v-model="selectedStatus"
//     :opsi="[
//       { nilai: '', teks: 'Semua Status' },
//       { nilai: 'Aktif', teks: 'Aktif' },
//     ]"
//   />

const props = defineProps({
  modelValue: { type: [String, Number], default: "" },

  // [{ nilai, teks }, ...]
  opsi: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue"]);

const slots = useSlots();

const adaIkon = computed(() => !!slots.ikon);

const terbuka = ref(false);

const teksTerpilih = computed(
  () =>
    props.opsi.find((o) => o.nilai === props.modelValue)?.teks ??
    props.opsi[0]?.teks ??
    ""
);

const pilih = (nilai) => {
  emit("update:modelValue", nilai);
  terbuka.value = false;
};
</script>

<template>
  <div class="relative">

    <!-- Ikon di dalam kotak (opsional) -->
    <span
      v-if="adaIkon"
      class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"
    >
      <slot name="ikon" />
    </span>

    <button
      type="button"
      :aria-expanded="terbuka"
      class="kotak-isian flex items-center justify-between pr-4 text-left"
      :class="[
        adaIkon ? 'pl-12' : 'pl-4',
        terbuka
          ? 'border-emerald-500 ring-2 ring-emerald-500'
          : 'border-slate-200',
      ]"
      @click="terbuka = !terbuka"
      @keydown.escape="terbuka = false"
    >
      <span class="text-slate-700 font-medium truncate">
        {{ teksTerpilih }}
      </span>

      <ChevronDown
        class="w-4 h-4 text-slate-400 transition-transform shrink-0"
        :class="terbuka && 'rotate-180'"
      />
    </button>

    <!-- Penutup: klik di luar untuk menutup daftar -->
    <div
      v-if="terbuka"
      class="fixed inset-0 z-20"
      @click="terbuka = false"
    ></div>

    <!-- Daftar pilihan -->
    <div
      v-if="terbuka"
      role="listbox"
      class="absolute z-30 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-200 py-2 max-h-64 overflow-auto"
    >
      <button
        v-for="o in opsi"
        :key="String(o.nilai)"
        type="button"
        role="option"
        :aria-selected="o.nilai === modelValue"
        class="w-full text-left px-4 py-2.5 text-sm font-medium transition flex items-center justify-between gap-2"
        :class="
          o.nilai === modelValue
            ? 'bg-emerald-50 text-emerald-700'
            : 'text-slate-700 hover:bg-slate-50'
        "
        @click="pilih(o.nilai)"
      >
        <span class="truncate">{{ o.teks }}</span>

        <Check
          v-if="o.nilai === modelValue"
          class="w-4 h-4 shrink-0"
        />
      </button>
    </div>

  </div>
</template>