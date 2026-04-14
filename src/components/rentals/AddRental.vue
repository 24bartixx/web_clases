<template>
  <div class="modal-overlay" @click.self="onCancel">
    <div class="modal">
      <h3>Create Rental</h3>
      <form @submit.prevent="onSubmit" novalidate>
        <div class="form-group">
          <label for="reader">Reader</label>
          <v-select
            id="reader"
            :options="readerOptions"
            v-model="form.readerId"
            :reduce="(reader) => reader.value"
            placeholder="Select reader"
            :clearable="false"
            :searchable="true"
            :disabled="Boolean(preselectedReaderId)"
            :class="{ invalid: errors.readerId }"
          />
          <div v-if="errors.readerId" class="input-error">{{ errors.readerId }}</div>
        </div>

        <div class="form-group">
          <label for="book">Book</label>
          <v-select
            id="book"
            :options="bookOptions"
            v-model="form.bookId"
            :reduce="(book) => book.value"
            placeholder="Select available book"
            :clearable="false"
            :searchable="true"
            :class="{ invalid: errors.bookId }"
          />
          <div v-if="errors.bookId" class="input-error">{{ errors.bookId }}</div>
        </div>

        <div class="modal-actions">
          <button type="submit" class="primary action update">Reserve</button>
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
  name: "AddRental",
  components: { vSelect },
  props: {
    show: Boolean,
    preselectedReaderId: {
      type: Number,
      default: null,
    },
  },
  emits: ["close", "added"],
  data() {
    return {
      readers: [],
      books: [],
      form: {
        readerId: this.preselectedReaderId,
        bookId: null,
      },
      errors: {},
      error: null,
    };
  },
  computed: {
    readerOptions() {
      return this.readers.map((r) => ({
        label: `${r.name} ${r.surname} (${r.email})`,
        value: r.id,
      }));
    },
    bookOptions() {
      return this.books
        .filter((b) => !b.rented)
        .map((b) => ({
          label: `${b.title} - ${b.author?.name || ""} ${b.author?.surname || ""}`.trim(),
          value: b.id,
        }));
    },
  },
  watch: {
    show(val) {
      if (val) {
        this.resetForm();
        this.fetchReaders();
        this.fetchBooks();
      }
    },
    preselectedReaderId(val) {
      this.form.readerId = val;
    },
  },
  methods: {
    async fetchReaders() {
      try {
        const res = await fetch(`${API_URL}/readers/`);
        this.readers = await res.json();
      } catch (e) {
        this.error = "Failed to load readers.";
      }
    },
    async fetchBooks() {
      try {
        const res = await fetch(`${API_URL}/books/?page=0&size=200`);
        const data = await res.json();
        this.books = data.content || [];
      } catch (e) {
        this.error = "Failed to load books.";
      }
    },
    validateForm() {
      const errors = {};
      if (!this.form.readerId) {
        errors.readerId = "Please select a reader";
      }
      if (!this.form.bookId) {
        errors.bookId = "Please select a book";
      }
      this.errors = errors;
      return Object.keys(errors).length === 0;
    },
    async onSubmit() {
      this.error = null;
      if (!this.validateForm()) {
        return;
      }

      try {
        const res = await fetch(`${API_URL}/rentals/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.form),
        });

        if (!res.ok) {
          const message = await res.text();
          throw new Error(message || "Failed to create rental");
        }

        this.$emit("added");
        this.$emit("close");
      } catch (e) {
        this.error = e?.message || "Failed to create rental";
      }
    },
    onCancel() {
      this.$emit("close");
    },
    resetForm() {
      this.form = {
        readerId: this.preselectedReaderId,
        bookId: null,
      };
      this.errors = {};
      this.error = null;
    },
  },
  mounted() {
    this.fetchReaders();
    this.fetchBooks();
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
  text-align: left;
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
.form-group .v-select {
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
}
.form-group select:focus,
.form-group input:focus,
.form-group .v-select:focus-within {
  border-color: #222;
  outline: none;
}
.form-group input.invalid,
.form-group select.invalid {
  border-color: #b00 !important;
  box-shadow: 0 0 0 1px #b00;
}
.form-group .v-select.invalid :deep(.vs__dropdown-toggle) {
  border-color: #b00 !important;
  box-shadow: 0 0 0 1px #b00;
}
.input-error {
  color: #b00;
  font-size: 0.95em;
  margin-top: 0.25rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-start;
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
  background: #1b6b4a;
  color: #fff;
}
button.primary.action.update:hover {
  background: #145238;
}
button.primary.action.delete {
  background: #b00;
  color: #fff;
}
button.primary.action.delete:hover {
  background: #900;
}
:deep(.vs__dropdown-option--highlight) {
  background: #444 !important;
  color: #fff !important;
}
:deep(.vs__dropdown-option--selected) {
  background: #444 !important;
  color: #fff !important;
}
</style>
