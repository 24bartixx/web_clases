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
      <button class="primary">Add book</button>
    </div>
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
            <button class="primary action update">Update</button>
            <button class="primary action delete">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { API_URL } from "@/config";

export default {
  name: "BooksPage",
  data() {
    return {
      books: [],
    };
  },
  methods: {
    async fetchBooks() {
      try {
        const response = await fetch(`${API_URL}/books/`);
        const data = await response.json();
        this.books = data;
        console.log(this.books);
      } catch (error) {
        console.error("Error fetching books:", error);
      }
    },
  },
  mounted() {
    this.fetchBooks();
  },
};
</script>

<style scoped>
/* Shared manage column styles */
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
</style>
