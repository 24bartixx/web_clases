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
      <h2 style="margin: 0">Rentals</h2>
      <div style="display: flex; gap: 0.5rem">
        <button
          v-if="selectedReaderId"
          class="primary action update"
          @click="clearReaderFilter"
        >
          Clear reader filter
        </button>
        <button class="primary action reserve" @click="showAddModal = true">
          Add rental
        </button>
      </div>
    </div>

    <div class="table-responsive rentals-table-desktop">
      <table>
        <thead>
          <tr>
            <th>Book</th>
            <th>Reader</th>
            <th>Rented at</th>
            <th>Returned at</th>
            <th class="manage-col manage-col-header">Manage</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rental in filteredRentals" :key="rental.id">
            <td>{{ rental.book?.title }}</td>
            <td>{{ rental.reader?.name }} {{ rental.reader?.surname }}</td>
            <td>{{ formatDate(rental.rentalDate) }}</td>
            <td>{{ formatDate(rental.returnDate) }}</td>
            <td class="manage-col manage-col-cell">
              <button
                class="primary action delete"
                @click="openDeleteModal(rental)"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="rentals-cards-mobile">
      <div class="rental-card" v-for="rental in filteredRentals" :key="rental.id">
        <div class="rental-card-row">
          <span class="rental-card-label">Book:</span>
          <span>{{ rental.book?.title }}</span>
        </div>
        <div class="rental-card-row">
          <span class="rental-card-label">Reader:</span>
          <span>{{ rental.reader?.name }} {{ rental.reader?.surname }}</span>
        </div>
        <div class="rental-card-row">
          <span class="rental-card-label">Rented:</span>
          <span>{{ formatDate(rental.rentalDate) }}</span>
        </div>
        <div class="rental-card-row">
          <span class="rental-card-label">Returned:</span>
          <span>{{ formatDate(rental.returnDate) }}</span>
        </div>
        <div class="rental-card-actions">
          <button class="primary action delete" @click="openDeleteModal(rental)">
            Delete
          </button>
        </div>
      </div>
    </div>

    <AddRental
      v-if="showAddModal"
      :show="showAddModal"
      :preselected-reader-id="selectedReaderId"
      @close="showAddModal = false"
      @added="handleRentalAdded"
    />

    <DeleteRental
      v-if="showDeleteModal"
      :show="showDeleteModal"
      :rental="selectedRental"
      @close="showDeleteModal = false"
      @deleted="handleRentalDeleted"
    />
  </div>
</template>

<script>
import { API_URL } from "@/config";

import AddRental from "@/components/rentals/AddRental.vue";
import DeleteRental from "@/components/rentals/DeleteRental.vue";

export default {
  name: "RentalsView",
  components: { AddRental, DeleteRental },
  data() {
    return {
      rentals: [],
      showAddModal: false,
      showDeleteModal: false,
      selectedRental: null,
      selectedReaderId: null,
      error: null,
      page: 0,
      size: 20,
      loading: false,
      allLoaded: false,
    };
  },
  computed: {
    filteredRentals() {
      if (!this.selectedReaderId) {
        return this.rentals;
      }
      return this.rentals.filter(
        (rental) => Number(rental?.reader?.id) === Number(this.selectedReaderId),
      );
    },
  },
  watch: {
    "$route.query.readerId": {
      immediate: true,
      handler(value) {
        this.selectedReaderId = value ? Number(value) : null;
      },
    },
  },
  methods: {
    async fetchRentals(reset = false) {
      if (reset) {
        this.page = 0;
        this.allLoaded = false;
        this.rentals = [];
      }

      if (this.loading || this.allLoaded) return;

      this.loading = true;
      this.error = null;
      try {
        const res = await fetch(
          `${API_URL}/rentals/?page=${this.page}&size=${this.size}`,
        );
        if (!res.ok) throw new Error("Failed to load rentals");
        const data = await res.json();

        // Fallback for backend that still returns a plain array.
        if (Array.isArray(data)) {
          this.rentals = data;
          this.allLoaded = true;
          return;
        }

        const rentalsPage = data.content || [];
        if (reset) {
          this.rentals = rentalsPage;
        } else {
          this.rentals = this.rentals.concat(rentalsPage);
        }

        if (data.last || rentalsPage.length === 0) {
          this.allLoaded = true;
        } else {
          this.page = data.number + 1;
        }
      } catch (e) {
        this.error = "Failed to load rentals.";
      } finally {
        this.loading = false;
      }
    },
    openDeleteModal(rental) {
      this.selectedRental = { ...rental };
      this.showDeleteModal = true;
    },
    handleRentalAdded() {
      this.resetAndFetch();
      this.showAddModal = false;
    },
    handleRentalDeleted() {
      this.resetAndFetch();
      this.showDeleteModal = false;
      this.selectedRental = null;
    },
    resetAndFetch() {
      this.fetchRentals(true);
    },
    clearReaderFilter() {
      this.$router.push({ path: "/rentals" });
    },
    handleScroll() {
      const scrollY = window.scrollY || window.pageYOffset;
      const visible = window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      if (scrollY + visible >= pageHeight - 200) {
        this.fetchRentals();
      }
    },
    formatDate(value) {
      return value || "-";
    },
  },
  mounted() {
    this.fetchRentals();
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

.rentals-cards-mobile {
  display: none;
}
.rental-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 1rem;
  padding: 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}
.rental-card-row {
  display: flex;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}
.rental-card-label {
  font-weight: bold;
  min-width: 80px;
  margin-right: 0.5rem;
}
.rental-card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

@media (max-width: 700px) {
  .table-responsive.rentals-table-desktop {
    display: none;
  }
  .rentals-cards-mobile {
    display: block;
  }
  .rental-card {
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
  .rentals-cards-mobile {
    display: none;
  }
}
</style>
