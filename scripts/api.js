const ApiService = {
  /**
   * Search for a location using Travel Advisor API
   * @param {string} query - Location name (e.g., "Paris", "Tokyo")
   * @returns {Promise} - Location data with location_id
   */
  searchLocation: async function (query) {
    const url = `https://${
      window.API_CONFIG.rapidApi.host
    }/locations/search?query=${encodeURIComponent(query)}&limit=1`;

    const options = {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": window.API_CONFIG.rapidApi.key,
        "X-RapidAPI-Host": window.API_CONFIG.rapidApi.host,
      },
    };

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Try several response shapes to find the first location result
      const candidate =
        (data && data.data && data.data[0]) ||
        (data && data.results && data.results[0]) ||
        (Array.isArray(data) && data[0]) ||
        data;

      // Attempt to extract a location id from common fields
      const locationId =
        candidate?.location_id ||
        candidate?.result_object?.location_id ||
        candidate?.result_object?.place_id ||
        candidate?.place_id ||
        candidate?.locationId ||
        null;

      if (!locationId) {
        console.warn("searchLocation: unexpected response shape", data);
        throw new Error("Location not found");
      }

      // Return a normalized location object
      return {
        location_id: locationId,
        name: candidate?.name || candidate?.result_object?.name || query,
        raw: candidate,
      };
    } catch (error) {
      console.error("Error searching location:", error);
      throw new Error(
        "Failed to search location. Please check your connection."
      );
    }
  },

  /**
   * Get attractions for a specific location
   * @param {string} locationId - Location ID from searchLocation()
   * @returns {Promise} - Array of attractions
   */
  getAttractions: async function (locationId) {
    const url = `https://${window.API_CONFIG.rapidApi.host}/attractions/list?location_id=${locationId}&limit=30&currency=USD&lang=en_US`;

    const options = {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": window.API_CONFIG.rapidApi.key,
        "X-RapidAPI-Host": window.API_CONFIG.rapidApi.host,
      },
    };

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Extract array from different possible response shapes
      const items = (data && (data.data || data.results)) || [];
      return this.formatAttractions(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Error fetching attractions:", error);
      throw new Error("Failed to fetch attractions.");
    }
  },

  /**
   * Get hotels for a specific location
   * @param {string} locationId - Location ID from searchLocation()
   * @returns {Promise} - Array of hotels
   */
  getHotels: async function (locationId) {
    const url = `https://${window.API_CONFIG.rapidApi.host}/hotels/list?location_id=${locationId}&limit=30&currency=USD&lang=en_US`;

    const options = {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": window.API_CONFIG.rapidApi.key,
        "X-RapidAPI-Host": window.API_CONFIG.rapidApi.host,
      },
    };

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const items = (data && (data.data || data.results)) || [];
      return this.formatHotels(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      throw new Error("Failed to fetch hotels.");
    }
  },

  /**
   * Get restaurants for a specific location
   * @param {string} locationId - Location ID from searchLocation()
   * @returns {Promise} - Array of restaurants
   */
  getRestaurants: async function (locationId) {
    const url = `https://${window.API_CONFIG.rapidApi.host}/restaurants/list?location_id=${locationId}&limit=30&currency=USD&lang=en_US`;

    const options = {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": window.API_CONFIG.rapidApi.key,
        "X-RapidAPI-Host": window.API_CONFIG.rapidApi.host,
      },
    };

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const items = (data && (data.data || data.results)) || [];
      return this.formatRestaurants(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      throw new Error("Failed to fetch restaurants.");
    }
  },

  formatAttractions: function (attractions) {
    return attractions
      .filter((item) => item.name && item.rating)
      .map((item) => ({
        type: "attraction",
        id: item.location_id,
        name: item.name,
        rating: parseFloat(item.rating) || 0,
        reviews: parseInt(item.num_reviews) || 0,
        description: item.description || "No description available.",
        price: item.price_level || "N/A",
        photo: item.photo?.images?.large?.url || null,
        address: item.address || "Address not available",
        category: item.subcategory?.[0]?.name || "Attraction",
        website: item.website || null,
        phone: item.phone || null,
      }))
      .sort((a, b) => b.rating - a.rating); // sorting data by rating
  },

  /**
   * Format hotels data from API response
   * @param {Array} hotels - Raw hotel data
   * @returns {Array} - Formatted hotels
   */
  formatHotels: function (hotels) {
    return hotels
      .filter((item) => item.name && item.rating)
      .map((item) => ({
        type: "hotel",
        id: item.location_id,
        name: item.name,
        rating: parseFloat(item.rating) || 0,
        reviews: parseInt(item.num_reviews) || 0,
        description: item.description || "No description available.",
        price: item.price_level || item.price || "N/A",
        photo: item.photo?.images?.large?.url || null,
        address: item.address || "Address not available",
        amenities: item.amenities || [],
        website: item.website || null,
        phone: item.phone || null,
      }))
      .sort((a, b) => b.rating - a.rating);
  },

  /**
   * Format restaurants data from API response
   * @param {Array} restaurants - Raw restaurant data
   * @returns {Array} - Formatted restaurants
   */
  formatRestaurants: function (restaurants) {
    return restaurants
      .filter((item) => item.name && item.rating)
      .map((item) => ({
        type: "restaurant",
        id: item.location_id,
        name: item.name,
        rating: parseFloat(item.rating) || 0,
        reviews: parseInt(item.num_reviews) || 0,
        description: item.description || "No description available.",
        price: item.price_level || "N/A",
        photo: item.photo?.images?.large?.url || null,
        address: item.address || "Address not available",
        cuisine: item.cuisine?.map((c) => c.name).join(", ") || "Various",
        website: item.website || null,
        phone: item.phone || null,
      }))
      .sort((a, b) => b.rating - a.rating);
  },

  /**
   * Fetch all data for a destination
   * @param {string} destination - Destination name
   * @param {string} category - Category filter ('all', 'attractions', 'hotels', 'restaurants')
   * @returns {Promise} - Object containing all fetched data
   */
  fetchDestinationData: async function (destination, category = "all") {
    try {
      const location = await this.searchLocation(destination);
      const locationId = location.location_id;

      const results = {
        location: location,
        attractions: [],
        hotels: [],
        restaurants: [],
      };

      const promises = [];

      if (category === "all" || category === "attractions") {
        promises.push(
          this.getAttractions(locationId)
            .then((data) => (results.attractions = data))
            .catch((err) => console.error("Attractions error:", err))
        );
      }

      if (category === "all" || category === "hotels") {
        promises.push(
          this.getHotels(locationId)
            .then((data) => (results.hotels = data))
            .catch((err) => console.error("Hotels error:", err))
        );
      }

      if (category === "all" || category === "restaurants") {
        promises.push(
          this.getRestaurants(locationId)
            .then((data) => (results.restaurants = data))
            .catch((err) => console.error("Restaurants error:", err))
        );
      }
      await Promise.all(promises);
    } catch (error) {
      console.error("Error fetching destination data:", error);
      throw error;
    }
  },
};

window.ApiService = ApiService;
