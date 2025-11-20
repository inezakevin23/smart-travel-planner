const UIService = {
  // DOM element references (cached for performance)
  elements: {
    loading: null,
    error: null,
    results: null,
    filters: null,
    searchBtn: null,
  },

  // Initializing UI elements (call this once on page load)
  init: function () {
    this.elements.loading = document.getElementById("loading");
    this.elements.error = document.getElementById("error");
    this.elements.results = document.getElementById("results");
    this.elements.filters = document.getElementById("filters");
    this.elements.searchBtn = document.getElementById("searchBtn");
  },

  showLoading: function () {
    this.elements.loading.classList.add("active");
    this.elements.error.classList.remove("active");
    this.elements.results.innerHTML = "";
    this.elements.filters.classList.remove("active");
    this.elements.searchBtn.disabled = true;
  },

  hideLoading: function () {
    this.elements.loading.classList.remove("active");
    this.elements.searchBtn.disabled = false;
  },

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  showError: function (message) {
    this.elements.error.textContent = message;
    this.elements.error.classList.add("active");
    this.hideLoading();
  },

  hideError: function () {
    this.elements.error.classList.remove("active");
  },

  showNoResults: function () {
    this.elements.results.innerHTML = `
            <div class="no-results">
                <h2>No results found</h2>
                <p>Try searching for a different destination or adjust your filters.</p>
            </div>
        `;
  },

  /**
   * Render all results to the page
   * @param {Object} data - Data object with attractions, hotels, restaurants
   */
  renderResults: function (data) {
    const { attractions, hotels, restaurants } = data;
    const hasResults =
      attractions.length > 0 || hotels.length > 0 || restaurants.length > 0;

    if (!hasResults) {
      this.showNoResults();
      return;
    }

    // Show filters
    this.elements.filters.classList.add("active");
    // Build the results HTML
    let html = "";
    // Create tabs
    html += '<div class="tabs">';
    if (attractions.length > 0) {
      html +=
        '<button class="tab active" data-tab="attractions">🏛️ Attractions (' +
        attractions.length +
        ")</button>";
    }
    if (hotels.length > 0) {
      html +=
        '<button class="tab" data-tab="hotels">🏨 Hotels (' +
        hotels.length +
        ")</button>";
    }
    if (restaurants.length > 0) {
      html +=
        '<button class="tab" data-tab="restaurants">🍽️ Restaurants (' +
        restaurants.length +
        ")</button>";
    }
    html += "</div>";
    // Create tab contents
    if (attractions.length > 0) {
      html += '<div class="tab-content active" id="attractions">';
      html += '<div class="grid">';
      attractions.forEach((item) => {
        html += this.createCard(item);
      });
      html += "</div></div>";
    }

    if (hotels.length > 0) {
      html += '<div class="tab-content" id="hotels">';
      html += '<div class="grid">';
      hotels.forEach((item) => {
        html += this.createCard(item);
      });
      html += "</div></div>";
    }

    if (restaurants.length > 0) {
      html += '<div class="tab-content" id="restaurants">';
      html += '<div class="grid">';
      restaurants.forEach((item) => {
        html += this.createCard(item);
      });
      html += "</div></div>";
    }

    this.elements.results.innerHTML = html;

    this.attachTabHandlers();
    this.hideLoading();
  },

  /**
   * Create a result card
   * @param {Object} item - Attraction, hotel, or restaurant data
   * @returns {string} - HTML string
   */
  createCard: function (item) {
    const icon =
      item.type === "attraction" ? "🏛️" : item.type === "hotel" ? "🏨" : "🍽️";

    // Create photo HTML if available
    const photoHtml = item.photo
      ? `<img src="${item.photo}" alt="${item.name}" class="card-image">`
      : `<div class="card-image-placeholder">${icon}</div>`;

    // Create price display
    const priceDisplay = this.formatPrice(item.price);

    // Truncate description if too long
    const description =
      item.description.length > 150
        ? item.description.substring(0, 150) + "..."
        : item.description;

    // Build tags based on item type
    let tags = [];
    if (item.type === "attraction" && item.category) {
      tags.push(item.category);
    }
    if (item.type === "restaurant" && item.cuisine) {
      tags.push(item.cuisine);
    }
    if (item.type === "hotel" && item.amenities && item.amenities.length > 0) {
      tags = item.amenities.slice(0, 3);
    }

    return `
            <div class="card" data-rating="${item.rating}" data-reviews="${
      item.reviews || 0
    }" data-price="${item.price}" data-type="${item.type}">
                ${photoHtml}
                <div class="card-content">
                    <div class="card-header">
                        <h3 class="card-title">${item.name}</h3>
                        <span class="card-badge">⭐ ${item.rating.toFixed(
                          1
                        )}</span>
                    </div>
                    <div class="card-body">
                        <p>${description}</p>
                        <div class="card-meta">
                            <span>💰 ${priceDisplay}</span>
                            <span>💬 ${item.reviews.toLocaleString()} reviews</span>
                        </div>
                        ${
                          item.address
                            ? `<p class="card-address">📍 ${item.address}</p>`
                            : ""
                        }
                    </div>
                    ${
                      tags.length > 0
                        ? `
                        <div class="card-footer">
                            ${tags
                              .map((tag) => `<span class="tag">${tag}</span>`)
                              .join("")}
                        </div>
                    `
                        : ""
                    }
                    ${this.createCardActions(item)}
                </div>
            </div>
        `;
  },

  /**
   * Create action buttons for a card
   * @param {Object} item - Item data
   * @returns {string} - HTML string
   */
  createCardActions: function (item) {
    let actions = '<div class="card-actions">';

    if (item.website) {
      actions += `<a href="${item.website}" target="_blank" class="btn-small">🌐 Website</a>`;
    }

    if (item.phone) {
      actions += `<a href="tel:${item.phone}" class="btn-small">📞 Call</a>`;
    }

    // Add Google Maps link
    const mapsQuery = encodeURIComponent(item.name + " " + item.address);
    actions += `<a href="https://www.google.com/maps/search/?api=1&query=${mapsQuery}" target="_blank" class="btn-small">🗺️ Map</a>`;

    actions += "</div>";
    return actions;
  },

  /**
   * Format price display
   * @param {string} price - Price level from API
   * @returns {string} - Formatted price string
   */
  formatPrice: function (price) {
    if (price === "N/A" || !price) return "Price not available";
    if (price === "Free") return "Free";
    if (price === "$" || price === "$$ - $$$") return "Budget Friendly";
    if (price === "$$" || price === "$$$") return "Moderate";
    if (price === "$$$$") return "Expensive";
    return price;
  },

  /**
   * Attach click handlers to tabs
   */
  attachTabHandlers: function () {
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        // Remove active class from all tabs and contents
        document
          .querySelectorAll(".tab")
          .forEach((t) => t.classList.remove("active"));
        document
          .querySelectorAll(".tab-content")
          .forEach((c) => c.classList.remove("active"));

        // Add active class to clicked tab and corresponding content
        tab.classList.add("active");
        const contentId = tab.getAttribute("data-tab");
        document.getElementById(contentId).classList.add("active");
      });
    });
  },

  /**
   * Filter displayed cards based on criteria
   * @param {Object} filters - Filter criteria
   */
  applyFilters: function (filters) {
    const { minRating, budgetOnly, searchText } = filters;
    const cards = document.querySelectorAll(".card");

    let visibleCount = 0;

    cards.forEach((card) => {
      let visible = true;

      // Rating filter
      if (minRating) {
        const cardRating = parseFloat(card.getAttribute("data-rating"));
        if (cardRating < minRating) visible = false;
      }

      // Budget filter
      if (budgetOnly) {
        const cardPrice = card.getAttribute("data-price");
        if (cardPrice !== "$" && cardPrice !== "Free") visible = false;
      }

      // Search filter
      if (searchText) {
        const cardText = card.textContent.toLowerCase();
        if (!cardText.includes(searchText.toLowerCase())) visible = false;
      }

      // Show/hide card
      if (visible) {
        card.style.display = "";
        visibleCount++;
      } else {
        card.style.display = "none";
      }
    });

    // Show message if no cards visible
    if (visibleCount === 0) {
      const activeTabContent = document.querySelector(".tab-content.active");
      if (activeTabContent) {
        const grid = activeTabContent.querySelector(".grid");
        if (grid) {
          grid.innerHTML = `
                        <div class="no-results" style="grid-column: 1/-1;">
                            <h3>No results match your filters</h3>
                            <p>Try adjusting your filter criteria.</p>
                        </div>
                    `;
        }
      }
    }
  },

  /**
   * Sort displayed cards
   * @param {string} sortBy - Sort criteria ('rating', 'reviews', 'name')
   */
  sortCards: function (sortBy) {
    const activeContent = document.querySelector(".tab-content.active");
    if (!activeContent) return;

    const grid = activeContent.querySelector(".grid");
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll(".card"));

    cards.sort((a, b) => {
      const nameA = a.querySelector(".card-title").textContent || "";
      const nameB = b.querySelector(".card-title").textContent || "";
      const ratingA = parseFloat(a.getAttribute("data-rating")) || 0;
      const ratingB = parseFloat(b.getAttribute("data-rating")) || 0;
      const reviewsA = parseInt(a.getAttribute("data-reviews")) || 0;
      const reviewsB = parseInt(b.getAttribute("data-reviews")) || 0;

      if (sortBy === "rating") return ratingB - ratingA;
      if (sortBy === "reviews") return reviewsB - reviewsA;
      if (sortBy === "name") return nameA.localeCompare(nameB);
      return 0;
    });

    grid.innerHTML = "";
    cards.forEach((card) => grid.appendChild(card));
  },
};

window.UIService = UIService;
