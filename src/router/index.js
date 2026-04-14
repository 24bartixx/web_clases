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
    component: () => import("../views/books/BooksView.vue"),
    meta: { layout: "MainLayout" },
  },
  {
    path: "/authors",
    name: "Authors",
    component: () => import("../views/authors/AuthorsView.vue"),
    meta: { layout: "MainLayout" },
  },
  {
    path: "/readers",
    name: "Readers",
    component: () => import("../views/readers/ReadersView.vue"),
    meta: { layout: "MainLayout" },
  },
  {
    path: "/rentals",
    name: "Rentals",
    component: () => import("../views/rentals/RentalsView.vue"),
    meta: { layout: "MainLayout" },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("../views/NotFoundView.vue"),
    meta: { layout: "MainLayout" },
  },
];

export default routes;
