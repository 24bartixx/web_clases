<template>
  <app-menu />
  <main style="margin-top: 90px">
    <slot />
  </main>
</template>

<script>
import AppMenu from "../components/common/Menu.vue";
export default {
  name: "MainLayout",
  components: { AppMenu },
};
</script>

<style scoped>
main {
  padding: 2rem 0;
}
</style>
