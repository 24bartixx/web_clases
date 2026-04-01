<template>
  <div class="modal-overlay" @click.self="onCancel">
    <div class="modal">
      <h3>Add Book</h3>
      <form @submit.prevent="onSubmit">
        <div class="form-group">
          <label for="title">Title</label>
          <input id="title" v-model="form.title" required />
        </div>
        <div class="form-group">
          <label for="author">Author</label>
          <v-select
            id="author"
            :options="authorOptions"
            v-model="form.authorId"
            :reduce="(author) => author.value"
            placeholder="Select author"
            :clearable="false"
            :searchable="false"
            required
          />
        </div>
        <div class="form-group">
          <label for="pages">Pages</label>
          <input
            id="pages"
            type="number"
            min="1"
            v-model.number="form.pages"
            required
          />
        </div>
        <div class="modal-actions">
          <button type="submit" class="primary action update">Add</button>
          <button type="button" class="primary action delete" @click="onCancel">
            Cancel
          </button>
        </div>
        <div v-if="error" class="error">{{ error }}</div>
      </form>
    </div>
  </div>
</template>

<script>
import { API_URL } from "@/config";
import vSelect from "vue3-select";
import "vue3-select/dist/vue3-select.css";

export default {
  name: "AddBook",
  components: { vSelect },
  props: {
    show: Boolean,
  },
  emits: ["close", "added"],
  data() {
    return {
      authors: [],
      form: {
        title: "",
        authorId: null,
        pages: 1,
      },
      error: null,
    };
  },
  computed: {
    authorOptions() {
      return this.authors.map((a) => ({
        label: `${a.name} ${a.surname}`,
        value: a.id,
      }));
    },
  },
  watch: {
    show(val) {
      if (val) {
        this.resetForm();
        this.fetchAuthors();
      }
    },
  },
  methods: {
    async fetchAuthors() {
      try {
        const res = await fetch(`${API_URL}/authors/`);
        this.authors = await res.json();
      } catch (e) {
        this.error = "Failed to load authors.";
      }
    },
    async onSubmit() {
      this.error = null;
      if (!this.form.authorId) {
        this.error = "Please select a valid author.";
        return;
      }
      try {
        const res = await fetch(`${API_URL}/books/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.form),
        });
        if (!res.ok) throw new Error("Failed to add book");
        this.$emit("added");
        this.$emit("close");
      } catch (e) {
        this.error = "Failed to add book.";
      }
    },
    onCancel() {
      this.$emit("close");
    },
    resetForm() {
      this.form = { title: "", authorId: null, pages: 1 };
      this.error = null;
    },
  },
  mounted() {
    this.fetchAuthors();
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
  min-width: 480px;
  max-width: 600px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.15);
}
.form-group {
  margin-bottom: 1rem;
  text-align: left;
}
.form-group label {
  display: block;
  margin-bottom: 0.25rem;
}
.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  font-size: 1rem;
  cursor: pointer;
  transition: border 0.2s;
}
.form-group select:focus {
  border-color: #222;
  outline: none;
}
.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
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

.v-select:not(.vs--searchable) .vs__search {
  display: none !important;
}

:deep(.vs__dropdown-option--highlight) {
  background: #444 !important;
  color: #fff !important;
}

:deep(.vs__dropdown-option--selected) {
  background: #444 !important;
  color: #fff !important;
}

:deep(.vs__search::placeholder) {
  color: #757575;
}

:deep(.vs__search) {
  display: block !important;
  opacity: 1;
  border: none;
}
</style>
