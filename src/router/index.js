import { createRouter, createWebHistory } from "vue-router";
import { supabase } from "../lib/supabase";

import Dashboard from "../pages/Dashboard.vue";
import InventoryDetail from "../pages/InventoryDetail.vue";
import AddInventory from "../pages/AddInventory.vue";
import EditInventory from "../pages/EditInventory.vue";
import QRCode from "../pages/QRCode.vue";
import Login from "../pages/Login.vue";
import SoldInventory from "../pages/SoldInventory.vue";

const routes = [
  {
    path: "/",
    name: "dashboard",
    component: Dashboard,
    meta: { requiresAuth: true },
  },

  {
    path: "/sold-inventory",
    name: "sold-inventory",
    component: SoldInventory,
    meta: { requiresAuth: true },
  },

  {
    path: "/login",
    name: "login",
    component: Login,
  },

  {
    path: "/add-inventory",
    name: "add-inventory",
    component: AddInventory,
    meta: { requiresAuth: true, hanyaKelola: true },
  },

  {
    path: "/edit-inventory/:kode",
    name: "edit-inventory",
    component: EditInventory,
    meta: { requiresAuth: true, hanyaKelola: true },
  },

  {
    path: "/qr/:kode",
    name: "qr-code",
    component: QRCode,
    meta: { requiresAuth: true },
  },

  {
    path: "/inventory/:kode",
    name: "inventory-detail",
    component: InventoryDetail,
    // sengaja TANPA requiresAuth — ini halaman hasil scan QR, harus tetap bebas diakses siapa saja
  },


];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// =======================
// Penjaga Rute (Auth Guard)
// =======================
router.beforeEach(async (to, from, next) => {
  const perluDicek = to.meta.requiresAuth || to.name === "login";

  if (!perluDicek) {
    next();
    return;
  }

  const { data } = await supabase.auth.getSession();
  const sudahLogin = !!data.session;
  const role = data.session?.user?.app_metadata?.role;

  if (to.meta.requiresAuth && !sudahLogin) {
    next("/login");
  } else if (to.meta.hanyaKelola && role === "viewer") {
    // akun direktur (view-only) tidak boleh buka halaman tambah / edit / QR
    next("/");
  } else if (to.name === "login" && sudahLogin) {
    next("/"); 
  } else {
    next();
  }
});

export default router;