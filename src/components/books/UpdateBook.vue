<template>
  <div class="modal-overlay" @click.self="onCancel">
    <div class="modal">
      <h3>Update Book</h3>
      <form @submit.prevent="onSubmit" novalidate>
        <div class="form-group">
          <label for="title">Title</label>
          <input
            id="title"
            v-model="form.title"
            :class="{ invalid: errors.title }"
            autocomplete="off"
          />
          <div v-if="errors.title" class="input-error">{{ errors.title }}</div>
        </div>
        <div class="form-group">
          <label for="author">Author</label>
          <v-select
            id="author"
            :options="authorOptions"
            v-model="form.author"
            placeholder="Select author"
            :clearable="false"
            :searchable="false"
            :class="{ invalid: errors.author }"
          />
          <div v-if="errors.author" class="input-error">
            {{ errors.author }}
          </div>
        </div>
        <div class="form-group">
          <label for="pages">Pages</label>
          <input
            id="pages"
            type="number"
            min="1"
            v-model.number="form.pages"
            :class="{ invalid: errors.pages }"
            autocomplete="off"
          />
          <div v-if="errors.pages" class="input-error">{{ errors.pages }}</div>
        </div>
        <div class="modal-actions">
          <button type="submit" class="primary action update">Update</button>
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
  name: "UpdateBook",
  components: { vSelect },
  props: {
    show: Boolean,
    book: Object,
  },
  emits: ["close", "updated"],
  data() {
    return {
      authors: [],
      form: {
        title: "",
        author: null,
        pages: 1,
      },
      bookConstraints: {
        minPages: 1,
        maxPages: 10000,
        minTitleLength: 1,
        maxTitleLength: 10,
      },
      errors: {},
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
      if (val && this.book) {
        this.resetForm();
        this.fetchAuthors();
        this.fetchValidationRules();
      }
    },
    book: {
      handler(newBook) {
        if (this.show && newBook) {
          this.form = {
            title: newBook.title,
            author: {
              label: `${newBook.author.name} ${newBook.author.surname}`,
              value: newBook.author.id,
            },
            pages: newBook.pages,
          };
        }
      },
      immediate: true,
      deep: true,
    },
  },
  methods: {
    async fetchValidationRules() {
      try {
        const res = await fetch(`${API_URL}/validationRules/book`);
        this.bookConstraints = await res.json();
      } catch (e) {
        console.error("Failed to load validation rules:", e);
      }
    },
    async fetchAuthors() {
      try {
        const res = await fetch(`${API_URL}/authors/`);
        const data = await res.json();
        this.authors = data.content || data || [];
      } catch (e) {
        this.error = "Failed to load authors.";
      }
    },
    validateForm() {
      const errors = {};
      const { title, author, pages } = this.form;

      if (!title || title.trim().length === 0) {
        errors.title = "Title is required";
      } else if (
        this.bookConstraints.minTitleLength &&
        title.length < this.bookConstraints.minTitleLength
      ) {
        errors.title = `Title must be at least ${this.bookConstraints.minTitleLength} characters long`;
      } else if (
        this.bookConstraints.maxTitleLength &&
        title.length > this.bookConstraints.maxTitleLength
      ) {
        errors.title = `Title must be at most ${this.bookConstraints.maxTitleLength} characters long`;
      }

      if (!author) {
        errors.author = "Please select an author";
      }

      if (pages === null || pages === undefined) {
        errors.pages = "Pages is required";
      } else if (
        this.bookConstraints.minPages &&
        pages < this.bookConstraints.minPages
      ) {
        errors.pages = `Pages must be at least ${this.bookConstraints.minPages}`;
      } else if (
        this.bookConstraints.maxPages &&
        pages > this.bookConstraints.maxPages
      ) {
        errors.pages = `Pages must be at most ${this.bookConstraints.maxPages}`;
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
        const payload = {
          title: this.form.title,
          authorId: this.form.author.value,
          pages: this.form.pages,
        };
        const res = await fetch(`${API_URL}/books/${this.book.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update book");
        this.$emit("updated");
        this.$emit("close");
      } catch (e) {
        this.error = "Failed to update book";
      }
    },
    onCancel() {
      this.$emit("close");
    },
    resetForm() {
      if (this.book) {
        this.form = {
          title: this.book.title,
          author: {
            label: `${this.book.author.name} ${this.book.author.surname}`,
            value: this.book.author.id,
          },
          pages: this.book.pages,
        };
      } else {
        this.form = { title: "", author: null, pages: 1 };
      }
      this.errors = {};
      this.error = null;
    },
  },
  mounted() {
    this.fetchAuthors();
    this.fetchValidationRules();
    if (this.book) {
      this.resetForm();
    }
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
.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
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
