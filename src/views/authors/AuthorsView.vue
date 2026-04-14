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
      <h2 style="margin: 0">Authors</h2>
      <button class="primary" @click="showAddModal = true">Add author</button>
    </div>
    <div class="table-responsive author-table-desktop">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Surname</th>
            <th class="manage-col manage-col-header">Manage</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="author in authors" :key="author.id">
            <td>{{ author.name }}</td>
            <td>{{ author.surname }}</td>
            <td class="manage-col manage-col-cell">
              <button
                class="primary action update"
                @click="openUpdateModal(author)"
              >
                Update
              </button>
              <button
                class="primary action delete"
                @click="openDeleteModal(author)"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- Card layout for mobile -->
    <div class="author-cards-mobile">
      <div class="author-card" v-for="author in authors" :key="author.id">
        <div class="author-card-row">
          <span class="author-card-label">Name:</span>
          <span>{{ author.name }}</span>
        </div>
        <div class="author-card-row">
          <span class="author-card-label">Surname:</span>
          <span>{{ author.surname }}</span>
        </div>
        <div class="author-card-actions">
          <button class="primary action update" @click="openUpdateModal(author)">
            Update
          </button>
          <button class="primary action delete" @click="openDeleteModal(author)">
            Delete
          </button>
        </div>
      </div>
    </div>
    <AddAuthor
      v-if="showAddModal"
      :show="showAddModal"
      @close="showAddModal = false"
      @added="fetchAuthors(true)  "
    />
    <UpdateAuthor
      v-if="showUpdateModal"
      :show="showUpdateModal"
      :author="selectedAuthor"
      @close="showUpdateModal = false"
      @updated="handleAuthorUpdated"
    />
    <DeleteAuthor
      v-if="showDeleteModal"
      :show="showDeleteModal"
      :author="selectedAuthor"
      @close="showDeleteModal = false"
      @deleted="handleAuthorDeleted"
    />
  </div>
</template>

<script>
import { API_URL } from "@/config";

import AddAuthor from "@/components/authors/AddAuthor.vue";
import DeleteAuthor from "@/components/authors/DeleteAuthor.vue";
import UpdateAuthor from "@/components/authors/UpdateAuthor.vue";

export default {
  name: "AuthorsView",
  components: { AddAuthor, DeleteAuthor, UpdateAuthor },
  data() {
    return {
      authors: [],
      showAddModal: false,
      showUpdateModal: false,
      showDeleteModal: false,
      selectedAuthor: null,
      page: 0,
      size: 20,
      loading: false,
      allLoaded: false,
    };
  },
  methods: {
    async fetchAuthors(reset = false) {
      if (this.loading || this.allLoaded) return;
      this.loading = true;
      try {
        const res = await fetch(
          `${API_URL}/authors/?page=${this.page}&size=${this.size}`
        );
        const data = await res.json();
        const authorsPage = data.content || [];

        if (reset) {
          this.authors = authorsPage;
        } else {
          this.authors = this.authors.concat(authorsPage);
        }
        if (data.last || authorsPage.length === 0) {
          this.allLoaded = true;
        } else {
          this.page = data.number + 1;
        }
      } catch (e) {
        this.error = "Failed to load authors.";
      } finally {
        this.loading = false;
      }
    },
    openUpdateModal(author) {
      this.selectedAuthor = { ...author };
      this.showUpdateModal = true;
    },
    handleAuthorUpdated() {
      this.resetAndFetch();
      this.showUpdateModal = false;
      this.selectedAuthor = null;
    },
    openDeleteModal(author) {
      this.selectedAuthor = { ...author };
      this.showDeleteModal = true;
    },
    handleAuthorDeleted() {
      
      this.resetAndFetch();
      this.showDeleteModal = false;
      this.selectedAuthor = null;
    },
    resetAndFetch() {
      this.page = 0;
      this.allLoaded = false;
      this.authors = [];
      this.fetchAuthors(true);
    },
    handleScroll() {
      const scrollY = window.scrollY || window.pageYOffset;
      const visible = window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      if (scrollY + visible >= pageHeight - 200) {
        this.fetchAuthors();
      }
    },
  },
  mounted() {
    this.fetchAuthors();
    window.addEventListener("scroll", this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
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
button.primary.action.delete {
  background: #b00;
  color: #fff;
}
button.primary.action.delete:hover {
  background: #900;
}

/* Card layout for mobile */
.author-cards-mobile {
  display: none;
}
.author-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 1rem;
  padding: 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}
.author-card-row {
  display: flex;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}
.author-card-label {
  font-weight: bold;
  min-width: 70px;
  margin-right: 0.5rem;
}
.author-card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

@media (max-width: 700px) {
  .table-responsive.author-table-desktop {
    display: none;
  }
  .author-cards-mobile {
    display: block;
  }
  .author-card {
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
  .author-cards-mobile {
    display: none;
  }
}
</style>
