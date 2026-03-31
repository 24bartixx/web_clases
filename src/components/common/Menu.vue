<template>
  <nav class="menu">
    <a :class="{ active: isActive('/') }" href="#/">Home</a>
    <a :class="{ active: isActive('/books') }" href="#/books">Books</a>
    <a :class="{ active: isActive('/not-found') }" href="#/not-found"
      >Not Found</a
    >
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
      const hash = this.currentPath.replace("#", "") || "/";
      return hash === path;
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
  color: #fff;
  text-decoration: none;
  font-weight: bold;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
}
.menu a.active {
  color: #ffc107;
  font-weight: 900;
  background: transparent !important;
}
.menu a:hover:not(.active),
.menu a:focus:not(.active) {
  color: #ffc107;
}
</style>
