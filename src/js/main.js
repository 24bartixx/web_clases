// Main custom scripts for site (moved from inline <script> in index.html)
// Responsibilities:
// - Chart initialization

(function () {
  "use strict";

  // Chart.js initialization
  function initChart() {
    const canvas = document.getElementById("travelChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: [
          "Włochy",
          "Hiszpania",
          "Francja",
          "Grecja",
          "Chorwacja",
          "Portugalia",
          "Turcja",
        ],
        datasets: [
          {
            label: "Liczba klientów",
            data: [57, 71, 89, 32, 18, 22, 45],
            backgroundColor: [
              "#F09EA7",
              "#F6CA94",
              "#FAFABE",
              "#C1EBC0",
              "#C7CAFF",
              "#CDABEB",
              "#F6C2F3",
            ],
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "top" } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initChart();

    // Material Design zoom animation for map modal
    const fabMap = document.getElementById("fabMap");
    const mapModal = document.getElementById("mapModal");
    if (fabMap && mapModal) {
      const modalContent = mapModal.querySelector(".fab-zoom-modal-content");
      mapModal.addEventListener("show.bs.modal", function () {
        if (modalContent) {
          modalContent.classList.remove("fab-zoom-animate-out");
          modalContent.classList.add("fab-zoom-animate-in");
        }
      });
      mapModal.addEventListener("hide.bs.modal", function () {
        if (modalContent) {
          modalContent.classList.remove("fab-zoom-animate-in");
          modalContent.classList.add("fab-zoom-animate-out");
        }
      });
      // Optional: set transform-origin based on FAB position
      fabMap.addEventListener("click", function () {
        if (modalContent) {
          const rect = fabMap.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          modalContent.style.setProperty("--fab-origin-x", `${x}px`);
          modalContent.style.setProperty("--fab-origin-y", `${y}px`);
        }
      });
    }
  });
})();
