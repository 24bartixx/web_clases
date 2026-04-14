<template>
  <div>
    <div
      style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5rem;
      "
    >
      <h2 style="margin: 0">Readers</h2>
      <button class="primary" @click="showAddModal = true">Add reader</button>
    </div>
    <div class="table-responsive reader-table-desktop">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Surname</th>
            <th>Email</th>
            <th class="manage-col manage-col-header">Manage</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="reader in readers" :key="reader.id">
            <td>{{ reader.name }}</td>
            <td>{{ reader.surname }}</td>
            <td>{{ reader.email }}</td>
            <td class="manage-col manage-col-cell">
              <button
                class="primary action reserve"
                @click="goToReserve(reader)"
              >
                Reserve
              </button>
              <button
                class="primary action update"
                @click="openUpdateModal(reader)"
              >
                Update
              </button>
              <button
                class="primary action delete"
                @click="openDeleteModal(reader)"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="reader-cards-mobile">
      <div class="reader-card" v-for="reader in readers" :key="reader.id">
        <div class="reader-card-row">
          <span class="reader-card-label">Name:</span>
          <span>{{ reader.name }}</span>
        </div>
        <div class="reader-card-row">
          <span class="reader-card-label">Surname:</span>
          <span>{{ reader.surname }}</span>
        </div>
        <div class="reader-card-row">
          <span class="reader-card-label">Email:</span>
          <span>{{ reader.email }}</span>
        </div>
        <div class="reader-card-actions">
          <button class="primary action reserve" @click="goToReserve(reader)">
            Reserve
          </button>
          <button class="primary action update" @click="openUpdateModal(reader)">
            Update
          </button>
          <button class="primary action delete" @click="openDeleteModal(reader)">
            Delete
          </button>
        </div>
      </div>
    </div>
    <AddReader
      v-if="showAddModal"
      :show="showAddModal"
      @close="showAddModal = false"
      @added="fetchReaders"
    />
    <UpdateReader
      v-if="showUpdateModal"
      :show="showUpdateModal"
      :reader="selectedReader"
      @close="showUpdateModal = false"
      @updated="handleReaderUpdated"
    />
    <DeleteReader
      v-if="showDeleteModal"
      :show="showDeleteModal"
      :reader="selectedReader"
      @close="showDeleteModal = false"
      @deleted="handleReaderDeleted"
    />
  </div>
</template>

<script>
import { API_URL } from "@/config";

import AddReader from "@/components/readers/AddReader.vue";
import DeleteReader from "@/components/readers/DeleteReader.vue";
import UpdateReader from "@/components/readers/UpdateReader.vue";

export default {
  name: "ReadersView",
  components: { AddReader, DeleteReader, UpdateReader },
  data() {
    return {
      readers: [],
      showAddModal: false,
      showUpdateModal: false,
      showDeleteModal: false,
      selectedReader: null,
    };
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
    openUpdateModal(reader) {
      this.selectedReader = { ...reader };
      this.showUpdateModal = true;
    },
    goToReserve(reader) {
      this.$router.push({
        path: "/rentals",
        query: { readerId: String(reader.id) },
      });
    },
    handleReaderUpdated() {
      this.fetchReaders();
      this.showUpdateModal = false;
      this.selectedReader = null;
    },
    openDeleteModal(reader) {
      this.selectedReader = { ...reader };
      this.showDeleteModal = true;
    },
    handleReaderDeleted() {
      this.fetchReaders();
      this.showDeleteModal = false;
      this.selectedReader = null;
    },
  },
  mounted() {
    this.fetchReaders();
  },
};
</script>

<style scoped>
.table-responsive {
  width: 100%;
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}
.manage-col {
  border-left: 2px solid #e0e0e0;
  min-width: 1px;
  width: 1%;
  white-space: nowrap;
  padding-left: 1rem;
  padding-right: 1rem;
}
.manage-col-header {
  text-align: left;
}
.manage-col-cell {
  text-align: right;
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
button.primary.action.reserve {
  background: #1b6b4a;
  color: #fff;
}
button.primary.action.reserve:hover {
  background: #145238;
}
button.primary.action.delete {
  background: #b00;
  color: #fff;
}
button.primary.action.delete:hover {
  background: #900;
}

.reader-cards-mobile {
  display: none;
}
.reader-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 1rem;
  padding: 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}
.reader-card-row {
  display: flex;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}
.reader-card-label {
  font-weight: bold;
  min-width: 70px;
  margin-right: 0.5rem;
}
.reader-card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

@media (max-width: 700px) {
  .table-responsive.reader-table-desktop {
    display: none;
  }
  .reader-cards-mobile {
    display: block;
  }
  .reader-card {
    font-size: 0.97rem;
    padding: 0.8rem;
  }
  h2 {
    font-size: 1.2rem;
  }
  button.primary {
    font-size: 0.95rem;
    padding: 0.4rem 1rem;
  }
}

@media (min-width: 701px) {
  .reader-cards-mobile {
    display: none;
  }
}
</style>
