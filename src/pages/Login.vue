<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";

const router = useRouter();

const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMsg = ref("");

const handleLogin = async () => {
  errorMsg.value = "";
  loading.value = true;

  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });

  loading.value = false;

  if (error) {
    errorMsg.value = "Email atau password salah.";
    return;
  }

  router.push("/");
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-emerald-50 flex items-center justify-center p-6">
    <div class="w-full max-w-sm">

      <div class="bg-gradient-to-r from-green-700 via-emerald-600 to-teal-500 text-white rounded-t-3xl p-8 text-center shadow-2xl">
        <h1 class="text-2xl font-extrabold tracking-wide">PRIMALAND 2</h1>
        <p class="text-green-100 mt-1 text-sm">Inventory Management System</p>
      </div>

      <form
        @submit.prevent="handleLogin"
        class="bg-white rounded-b-3xl shadow-2xl border border-t-0 border-slate-200 p-8 space-y-5"
      >
        <div>
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="nama@primaland2.id"
            class="mt-1.5 w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
          />
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Password</label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="mt-1.5 w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
          />
        </div>

        <p v-if="errorMsg" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {{ errorMsg }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-gradient-to-r from-green-700 to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-xl transition disabled:opacity-60"
        >
          {{ loading ? "Memproses..." : "Masuk" }}
        </button>
      </form>

    </div>
  </div>
</template>