<script setup>
import { ref, watchEffect } from "vue";
import QRCode from "qrcode";

const props = defineProps({
  value: {
    type: String,
    required: true,
  },
});

const qrCode = ref("");

watchEffect(async () => {
  qrCode.value = await QRCode.toDataURL(props.value);
});
</script>

<template>
  <div class="bg-white rounded-2xl p-5 shadow border text-center">
    <img
      :src="qrCode"
      alt="QR Code"
      class="mx-auto w-44 h-44"
    />

    <p class="mt-3 text-sm text-gray-500">
      Scan QR untuk melihat detail inventaris
    </p>
  </div>
</template>