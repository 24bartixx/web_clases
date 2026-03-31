<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import MainLayout from "./layouts/MainLayout.vue";

const layouts = {
  MainLayout,
};

const route = useRoute();
const layoutName = computed(() => route.meta.layout || "MainLayout");
const layoutComponent = computed(() => layouts[layoutName.value] || MainLayout);
</script>

<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
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
  margin-top: 90px;
}
</style>
