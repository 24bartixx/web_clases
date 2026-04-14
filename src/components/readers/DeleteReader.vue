<template>
  <div class="modal-overlay" @click.self="onCancel">
    <div class="modal">
      <h3>Delete Reader</h3>
      <p>
        Are you sure you want to delete the reader
        <b>{{ reader?.name }} {{ reader?.surname }}</b>?
      </p>
      <div class="modal-actions">
        <button
          class="primary action delete"
          @click="onDelete"
          :disabled="loading"
        >
          Delete
        </button>
        <button
          class="primary action update"
          @click="onCancel"
          :disabled="loading"
        >
          Cancel
        </button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </div>
</template>

<script>
import { API_URL } from "@/config";

export default {
  name: "DeleteReader",
  props: {
    show: Boolean,
    reader: Object,
  },
  emits: ["close", "deleted"],
  data() {
    return {
      error: null,
      loading: false,
    };
  },
  watch: {
    show(val) {
      if (val) {
        this.error = null;
        this.loading = false;
      }
    },
  },
  methods: {
    async onDelete() {
      this.error = null;
      this.loading = true;
      try {
        const res = await fetch(`${API_URL}/readers/${this.reader.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete reader");
        this.$emit("deleted");
        this.$emit("close");
      } catch (e) {
        this.error = "Failed to delete reader";
      } finally {
        this.loading = false;
      }
    },
    onCancel() {
      this.$emit("close");
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  min-width: 400px;
  max-width: 500px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.15);
  text-align: left;
}
.modal-actions {
  display: flex;
  justify-content: flex-start;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
.error {
  color: #b00;
  margin-top: 0.5rem;
}
button.primary {
  background: #222;
  color: #fff;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
button.primary:hover {
  background: #000;
}
button.action {
  margin-right: 0.5rem;
}
button.action:last-child {
  margin-right: 0;
}
button.primary.action.update {
  background: #222;
  color: #fff;
}
button.primary.action.update:hover {
  background: #000;
}
button.primary.action.delete {
  background: #b00;
  color: #fff;
}
button.primary.action.delete:hover {
  background: #900;
}
</style>
