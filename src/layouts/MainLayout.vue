<template>
  <app-menu />
  <div class="container">
    <main style="margin-top: 90px">
      <slot />
    </main>
  </div>
</template>

<script>
import AppMenu from "../components/common/Menu.vue";
export default {
  name: "MainLayout",
  components: { AppMenu },
};
</script>

<style scoped>
.container {
  margin-left: auto;
  margin-right: auto;
  max-width: 1000px;
  width: 100%;
}
main {
  padding: 2rem 0;
}
</style>
