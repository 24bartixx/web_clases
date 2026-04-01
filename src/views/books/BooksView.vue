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
      <h2 style="margin: 0">Books</h2>
      <button class="primary" @click="showAddModal = true">Add book</button>
    </div>
    <div class="table-responsive book-table-desktop">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Pages</th>
            <th>Rented</th>
            <th class="manage-col manage-col-header">Manage</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="book in books" :key="book.id">
            <td>{{ book.title }}</td>
            <td>{{ book.author.name }} {{ book.author.surname }}</td>
            <td>{{ book.pages }}</td>
            <td>{{ book.rented ? "Yes" : "No" }}</td>
            <td class="manage-col manage-col-cell">
              <button
                class="primary action update"
                @click="openUpdateModal(book)"
              >
                Update
              </button>
              <button
                class="primary action delete"
                @click="openDeleteModal(book)"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- Card layout for mobile -->
    <div class="book-cards-mobile">
      <div class="book-card" v-for="book in books" :key="book.id">
        <div class="book-card-row">
          <span class="book-card-label">Title:</span>
          <span>{{ book.title }}</span>
        </div>
        <div class="book-card-row">
          <span class="book-card-label">Author:</span>
          <span>{{ book.author.name }} {{ book.author.surname }}</span>
        </div>
        <div class="book-card-row">
          <span class="book-card-label">Pages:</span>
          <span>{{ book.pages }}</span>
        </div>
        <div class="book-card-row">
          <span class="book-card-label">Rented:</span>
          <span>{{ book.rented ? "Yes" : "No" }}</span>
        </div>
        <div class="book-card-actions">
          <button class="primary action update" @click="openUpdateModal(book)">
            Update
          </button>
          <button class="primary action delete" @click="openDeleteModal(book)">
            Delete
          </button>
        </div>
      </div>
    </div>
    <AddBook
      v-if="showAddModal"
      :show="showAddModal"
      @close="showAddModal = false"
      @added="fetchBooks"
    />
    <UpdateBook
      v-if="showUpdateModal"
      :show="showUpdateModal"
      :book="selectedBook"
      @close="showUpdateModal = false"
      @updated="handleBookUpdated"
    />
    <DeleteBook
      v-if="showDeleteModal"
      :show="showDeleteModal"
      :book="selectedBook"
      @close="showDeleteModal = false"
      @deleted="handleBookDeleted"
    />
  </div>
</template>

<script>
import { API_URL } from "@/config";

import AddBook from "../../components/books/AddBook.vue";
import UpdateBook from "../../components/books/UpdateBook.vue";
import DeleteBook from "../../components/books/DeleteBook.vue";

export default {
  name: "BooksView",
  components: { AddBook, UpdateBook, DeleteBook },
  data() {
    return {
      books: [],
      showAddModal: false,
      showUpdateModal: false,
      showDeleteModal: false,
      selectedBook: null,
      page: 0,
      size: 20,
      loading: false,
      allLoaded: false,
    };
  },
  methods: {
    async fetchBooks(reset = false) {
      if (this.loading || this.allLoaded) return;
      this.loading = true;
      try {
        const response = await fetch(
          `${API_URL}/books/?page=${this.page}&size=${this.size}`,
        );
        const data = await response.json();
        const booksPage = data.content || [];
        if (reset) {
          this.books = booksPage;
        } else {
          this.books = this.books.concat(booksPage);
        }
        if (data.last || booksPage.length === 0) {
          this.allLoaded = true;
        } else {
          this.page = data.number + 1;
        }
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        this.loading = false;
      }
    },
    openUpdateModal(book) {
      this.selectedBook = { ...book };
      this.showUpdateModal = true;
    },
    handleBookUpdated() {
      this.resetAndFetch();
      this.showUpdateModal = false;
      this.selectedBook = null;
    },
    openDeleteModal(book) {
      this.selectedBook = { ...book };
      this.showDeleteModal = true;
    },
    handleBookDeleted() {
      this.resetAndFetch();
      this.showDeleteModal = false;
      this.selectedBook = null;
    },
    resetAndFetch() {
      this.page = 0;
      this.allLoaded = false;
      this.books = [];
      this.fetchBooks(true);
    },
    handleScroll() {
      const scrollY = window.scrollY || window.pageYOffset;
      const visible = window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      if (scrollY + visible >= pageHeight - 200) {
        this.fetchBooks();
      }
    },
  },
  mounted() {
    this.fetchBooks();
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
.book-cards-mobile {
  display: none;
}
.book-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 1rem;
  padding: 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}
.book-card-row {
  display: flex;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}
.book-card-label {
  font-weight: bold;
  min-width: 70px;
  margin-right: 0.5rem;
}
.book-card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

@media (max-width: 700px) {
  .table-responsive.book-table-desktop {
    display: none;
  }
  .book-cards-mobile {
    display: block;
  }
  .book-card {
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
  .book-cards-mobile {
    display: none;
  }
}
</style>
