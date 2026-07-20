import { createRouter, createWebHistory } from "vue-router";

import Dashboard from "../pages/Dashboard.vue";
import InventoryDetail from "../pages/InventoryDetail.vue";
import AddInventory from "../pages/AddInventory.vue";
import EditInventory from "../pages/EditInventory.vue";
import QRCode from "../pages/QRCode.vue";

const routes = [
  {
    path: "/",
    name: "dashboard",
    component: Dashboard,
  },

  {
  path: "/add-inventory",
  name: "add-inventory",
  component: AddInventory,
  },

  {
    path: "/edit-inventory/:kode",
    name: "edit-inventory",
    component: EditInventory,
  },

  {
  path: "/qr/:kode",
  name: "qr-code",
  component: QRCode,
  },

  {
    path: "/inventory/:kode",
    name: "inventory-detail",
    component: InventoryDetail,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;