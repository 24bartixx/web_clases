<script setup>
import { ref, computed } from "vue";
import BooksPage from "./components/books/BooksPage.vue";
import NotFoundPage from "./components/common/NotFoundPage.vue";
import AppMenu from "./components/common/Menu.vue";

const routes = {
  "/books": BooksPage,
  "/not-found": NotFoundPage,
};

const currentPath = ref(window.location.hash);

window.addEventListener("hashchange", () => {
  currentPath.value = window.location.hash;
});

const currentView = computed(() => {
  return routes[currentPath.value.slice(1) || "/"] || NotFoundPage;
});
</script>

<template>
  <app-menu />
  <component :is="currentView" />
</template>

<script>
export default {
  name: "App",
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 90px; /* Space for fixed menu */
}
</style>
