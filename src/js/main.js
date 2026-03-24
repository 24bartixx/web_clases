// Main custom scripts for site (moved from inline <script> in index.html)
// Responsibilities:
// - Chart initialization

(function () {
  'use strict';

  // Chart.js initialization
  function initChart() {
    const canvas = document.getElementById('travelChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Włochy', 'Hiszpania', 'Francja', 'Grecja', 'Chorwacja', 'Portugalia', 'Turcja'],
        datasets: [{
          label: 'Liczba klientów',
          data: [57, 71, 89, 32, 18, 22, 45],
          backgroundColor: ['#F09EA7', '#F6CA94', '#FAFABE', '#C1EBC0', '#C7CAFF', '#CDABEB', '#F6C2F3'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initChart();
  });

})();
