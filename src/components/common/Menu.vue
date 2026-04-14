<template>
  <nav class="menu">
    <a :class="{ active: isActive('/') }" href="#/">Home</a>
    <a :class="{ active: isActive('/books') }" href="#/books">Books</a>
    <a :class="{ active: isActive('/authors') }" href="#/authors">Authors</a>
    <a :class="{ active: isActive('/readers') }" href="#/readers">Readers</a>
    <a :class="{ active: isActive('/rentals') }" href="#/rentals">Rentals</a>
  </nav>
</template>

<script>
export default {
  name: "app-menu",
  data() {
    return {
      currentPath: window.location.hash,
    };
  },
  created() {
    window.addEventListener("hashchange", this.updatePath);
  },
  beforeUnmount() {
    window.removeEventListener("hashchange", this.updatePath);
  },
  methods: {
    updatePath() {
      this.currentPath = window.location.hash;
    },
    isActive(path) {
      if (this.$route && this.$route.path) {
        return this.$route.path === path;
      }

      const hash = (this.currentPath || "").replace(/^#/, "") || "/";
      const [pathname] = hash.split("?");
      const normalizedCurrent = pathname.replace(/\/+$/, "") || "/";
      const normalizedTarget = path.replace(/\/+$/, "") || "/";
      return normalizedCurrent === normalizedTarget;
    },
  },
};
</script>

<style scoped>
.menu {
  display: flex;
  justify-content: center;
  gap: 2rem;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  background: #181818;
  z-index: 1000;
  padding: 1rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.menu a {
  color: #bbb;
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;
  line-height: 1.5;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s, font-weight 0.2s;
  display: flex;
  align-items: center;
  height: 2.5rem;
}
.menu a.active,
.menu a:hover,
.menu a:focus {
  color: #fff;
  font-weight: 900;
  background: transparent !important;
}
</style>
