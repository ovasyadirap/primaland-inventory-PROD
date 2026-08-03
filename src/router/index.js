import { createRouter, createWebHistory } from "vue-router";
import { supabase } from "../lib/supabase";

import Dashboard from "../pages/Dashboard.vue";
import InventoryDetail from "../pages/InventoryDetail.vue";
import AddInventory from "../pages/AddInventory.vue";
import EditInventory from "../pages/EditInventory.vue";
import QRCode from "../pages/QRCode.vue";
import Login from "../pages/Login.vue";

const routes = [
  {
    path: "/",
    name: "dashboard",
    component: Dashboard,
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
    meta: { requiresAuth: true },
  },

  {
    path: "/edit-inventory/:kode",
    name: "edit-inventory",
    component: EditInventory,
    meta: { requiresAuth: true },
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

  if (to.meta.requiresAuth && !sudahLogin) {
    next("/login");
  } else if (to.name === "login" && sudahLogin) {
    next("/"); // udah login, nggak perlu lihat halaman login lagi
  } else {
    next();
  }
});

export default router;