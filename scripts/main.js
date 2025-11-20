const TravelPlannerApp = {
  // Store current data for filtering/sorting
  currentData: null,
  currentDestination: "",

  //  Initialize the application and is called when DOM is fully loaded
  init: function () {
    console.log("🚀 Travel Planner App Starting...");
    UIService.init();
    this.attachEventListeners();

    console.log("✅ App Ready!");
  },

  attachEventListeners: function () {
    const searchForm = document.getElementById("searchForm");
    if (searchForm) {
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSearch();
      });
    }

    // Filter: Minimum Rating
    const filterRating = document.getElementById("filterRating");
    if (filterRating) {
      filterRating.addEventListener("change", () => {
        this.applyFilters();
      });
    }

    // Budget filter removed (no DOM element)

    // Filter: Search within results
    const searchFilter = document.getElementById("searchFilter");
    if (searchFilter) {
      searchFilter.addEventListener("input", () => {
        this.applyFilters();
      });
    }

    // Sort dropdown
    const sortSelect = document.getElementById("sortBy");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        UIService.sortCards(e.target.value);
      });
    }

    // Reset filters button
    const resetBtn = document.getElementById("resetFilters");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.resetFilters();
      });
    }
  },

  handleSearch: async function () {
    const destination = document.getElementById("destination").value.trim();
    const category = document.getElementById("category").value;

    if (!destination) {
      UIService.showError("Please enter a destination.");
      return;
    }
    this.currentDestination = destination;
    UIService.showLoading();
    UIService.hideError();

    try {
      console.log(`🔍 Searching for: ${destination} (Category: ${category})`);

      const data = await ApiService.fetchDestinationData(destination, category);

      console.log("✅ Data received:", data);

      if (!data) {
        UIService.showError("No data returned from API.");
        UIService.hideLoading();
        return;
      }

      this.currentData = data;

      // Check if we got any results (tolerant if arrays are missing)
      const attractions = Array.isArray(data.attractions)
        ? data.attractions
        : [];
      const hotels = Array.isArray(data.hotels) ? data.hotels : [];
      const restaurants = Array.isArray(data.restaurants)
        ? data.restaurants
        : [];

      const hasResults =
        attractions.length > 0 || hotels.length > 0 || restaurants.length > 0;

      if (!hasResults) {
        UIService.showNoResults();
        UIService.hideLoading();
        return;
      }
      UIService.renderResults(data);

      // Reset filters
      this.resetFilters();

      console.log("✅ Results rendered successfully!");
    } catch (error) {
      console.error("❌ Search error:", error);
      UIService.showError(
        error.message || "An error occurred while searching. Please try again."
      );
    }
  },

  /**
   * Apply filters to current results
   */
  applyFilters: function () {
    if (!this.currentData) return;

    const ratingEl = document.getElementById("filterRating");
    const searchEl = document.getElementById("searchFilter");

    const minRating = ratingEl && ratingEl.checked ? 4.0 : null;
    const searchText = searchEl ? searchEl.value.trim() : "";

    // Apply filters via UI Service
    UIService.applyFilters({
      minRating: minRating,
      searchText: searchText,
    });

    console.log("🔄 Filters applied:", { minRating, searchText });
  },
  resetFilters: function () {
    const ratingEl = document.getElementById("filterRating");
    const searchEl = document.getElementById("searchFilter");

    if (ratingEl) ratingEl.checked = false;
    if (searchEl) searchEl.value = "";
    this.applyFilters();

    console.log("🔄 Filters reset");
  },

  // Export current results as JSON
  exportResults: function () {
    if (!this.currentData) {
      alert("No data to export. Please search for a destination first.");
      return;
    }

    const dataStr = JSON.stringify(this.currentData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${this.currentDestination.replace(
      /\s+/g,
      "_"
    )}_travel_data.json`;
    link.click();

    console.log("💾 Data exported");
  },
};

document.addEventListener("DOMContentLoaded", () => {
  TravelPlannerApp.init();
});

window.TravelPlannerApp = TravelPlannerApp;
