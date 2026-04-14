<template>
  <div class="modal-overlay" @click.self="onCancel">
    <div class="modal">
      <h3>Update Reader</h3>
      <form @submit.prevent="onSubmit" novalidate>
        <div class="form-group">
          <label for="name">Name</label>
          <input
            id="name"
            v-model="form.name"
            :class="{ invalid: errors.name }"
            autocomplete="off"
          />
          <div v-if="errors.name" class="input-error">{{ errors.name }}</div>
        </div>
        <div class="form-group">
          <label for="surname">Surname</label>
          <input
            id="surname"
            v-model="form.surname"
            :class="{ invalid: errors.surname }"
            autocomplete="off"
          />
          <div v-if="errors.surname" class="input-error">{{ errors.surname }}</div>
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            v-model="form.email"
            :class="{ invalid: errors.email }"
            autocomplete="off"
          />
          <div v-if="errors.email" class="input-error">{{ errors.email }}</div>
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

export default {
  name: "UpdateReader",
  props: {
    show: Boolean,
    reader: Object,
  },
  emits: ["close", "updated"],
  data() {
    return {
      form: {
        name: this.reader ? this.reader.name : "",
        surname: this.reader ? this.reader.surname : "",
        email: this.reader ? this.reader.email : "",
      },
      errors: {},
      error: null,
      readerConstraints: {
        minNameLength: 1,
        maxNameLength: 50,
        minSurnameLength: 1,
        maxSurnameLength: 50,
        minEmailLength: 3,
        maxEmailLength: 120,
      },
    };
  },
  methods: {
    async fetchValidationRules() {
      try {
        const res = await fetch(`${API_URL}/validationRules/reader`);
        if (!res.ok) throw new Error("Failed to fetch rules");
        this.readerConstraints = {
          ...this.readerConstraints,
          ...(await res.json()),
        };
      } catch (e) {
        // Keep defaults so form still validates even when rules endpoint is unavailable.
      }
    },
    validateForm() {
      const errors = {};
      const { name, surname, email } = this.form;
      const c = this.readerConstraints;

      if (
        !name ||
        name.length < c.minNameLength ||
        name.length > c.maxNameLength
      ) {
        errors.name = `Name must be between ${c.minNameLength} and ${c.maxNameLength} characters`;
      }
      if (
        !surname ||
        surname.length < c.minSurnameLength ||
        surname.length > c.maxSurnameLength
      ) {
        errors.surname = `Surname must be between ${c.minSurnameLength} and ${c.maxSurnameLength} characters`;
      }
      if (!email || email.length < c.minEmailLength || email.length > c.maxEmailLength) {
        errors.email = `Email must be between ${c.minEmailLength} and ${c.maxEmailLength} characters`;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Email format is invalid";
      }
      this.errors = errors;
      return Object.keys(errors).length === 0;
    },
    async onSubmit() {
      this.error = null;

      this.form.name = this.form.name.trim();
      this.form.surname = this.form.surname.trim();
      this.form.email = this.form.email.trim();

      if (!this.validateForm()) {
        return;
      }
      try {
        const res = await fetch(`${API_URL}/readers/${this.reader.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.form),
        });
        if (!res.ok) throw new Error("Failed to update reader");
        this.$emit("updated");
        this.$emit("close");
      } catch (e) {
        this.error = "Failed to update reader";
      }
    },
    onCancel() {
      this.$emit("close");
    },
  },
  mounted() {
    this.fetchValidationRules();
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
.form-group input:focus,
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
.form-group input.invalid,
.form-group select.invalid {
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
</style>
