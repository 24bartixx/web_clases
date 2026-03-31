const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("../views/HomeView.vue"),
    meta: { layout: "MainLayout" },
  },
  {
    path: "/books",
    name: "Books",
    component: () => import("../components/books/BooksPage.vue"),
    meta: { layout: "MainLayout" },
  },
  // login route removed
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("../components/common/NotFoundPage.vue"),
    meta: { layout: "MainLayout" },
  },
];

export default routes;
