import { ref, computed } from "vue";
import { supabase } from "./supabase";

// =======================
// Role Pengguna
// =======================
// Role disimpan di app_metadata (hanya bisa diubah dari Supabase,
// tidak bisa diubah lewat browser).
//
//   - role "viewer"        -> akun direktur, hanya boleh MELIHAT
//   - tanpa role (kosong)  -> akun tim ops, boleh tambah / edit / hapus
//
// Catatan: menyembunyikan tombol hanya soal tampilan.
// Yang benar-benar mengunci data adalah aturan RLS di Supabase.

// null = belum login / belum diketahui
const role = ref(null);

const bacaRole = (session) => {
  if (!session) {
    role.value = null;
    return;
  }

  role.value = session.user?.app_metadata?.role ?? "pengelola";
};

// Baca saat aplikasi pertama kali dibuka
supabase.auth.getSession().then(({ data }) => {
  bacaRole(data.session);
});

// Perbarui otomatis saat login, logout, atau token diperbarui
supabase.auth.onAuthStateChange((_event, session) => {
  bacaRole(session);
});

// true  = akun direktur (view-only)
export const isViewer = computed(() => role.value === "viewer");

// true  = boleh tambah / edit / hapus
// (false selama role belum diketahui, jadi tombol tidak sempat "berkedip")
export const bolehKelola = computed(
  () => role.value !== null && role.value !== "viewer"
);