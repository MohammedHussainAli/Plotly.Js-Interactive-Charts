document.addEventListener("DOMContentLoaded", function () {
  const loader = document.getElementById("loader");
  const monthSelect = document.getElementById("monthSelect");
  const countrySelect = document.getElementById("countrySelect");
  const resetFilters = document.getElementById("resetFilters");

  function showLoader() {
    loader.style.display = "block";
  }

  function hideLoader() {
    loader.style.display = "none";
  }

  // Fetching Data from JSON (Simulating the API call)
  function fetchData() {
    showLoader();
    return axios
      .get("/assets/Json/CBAM.json")
      .then((response) => {
        hideLoader();
        return response.data;
      })
      .catch((error) => {
        hideLoader();
        console.error("Error fetching data:", error);
        return [];
      });
  }

  // Fetching Data from JSON (Simulating the API call) for Per-Product
  function fetchDataPerProduct() {
    showLoader();
    return axios
      .get("/assets/Json/CBAM_Product.json")
      .then((response) => {
        hideLoader();
        return response.data;
      })
      .catch((error) => {
        hideLoader();
        console.error("Error fetching data:", error);
        return [];
      });
  }

  fetchDataPerProduct().then((data) => {
    // Call function to create stacked bar chart
    createStackedBarChart(data);
  });

  fetchDataPerProduct().then((data) => {
    createStackedBarChart(data);
    createHeatmap(data);
  });

  function createStackedBarChart(data) {
    showLoader();

    const { co2_per_product } = data;
    const products = Object.keys(co2_per_product);
    const regions = {};

    // Collect all unique regions
    products.forEach((product) => {
      const productData = co2_per_product[product];
      Object.keys(productData).forEach((region) => {
        if (!regions[region]) {
          regions[region] = {};
        }
      });
    });

    // Initialize data structure for Plotly
    const plotData = products.map((product, index) => ({
      x: Object.keys(regions),
      y: Object.keys(regions).map((region) => co2_per_product[product][region]),
      name: formatProductName(product), // Replace underscores with spaces
      type: "bar",
      marker: {
        color:
          index === 0
            ? "#6b0f01"
            : index === 1
            ? "#a11602"
            : index === 2
            ? "#bc594a"
            : index === 3
            ? "#d79b93"
            : "#e4bcb7", // Use specified colors
      },
    }));

    const layout = {
      // title: "CO2 Emissions per Product and Region",
      barmode: "stack",
      xaxis: {
        title: "Regions",
        tickangle: 0,
        tickfont: { family: "Akkurat LL Light", size: 10, color: "#0a0a0a" },
      },
      yaxis: {
        title: "CO2 Emissions",
        tickfont: { family: "Akkurat LL Light", size: 10, color: "#0a0a0a" },
      },
      font: { family: "Akkurat Pro Light", size: 11, color: "#0a0a0a" },
      legend: {
        orientation: "h",
        yanchor: "bottom",
        y: 1.1,
        x: 0.5,
        yanchor: "bottom",
        xanchor: "center",
      },
      font: {
        size: 11,
        color: "black",
      },
      paper_bgcolor: "white",
      plot_bgcolor: "white",
      autosize: true,
      width: document.getElementById("stackedBarChart").offsetWidth,
      height: 600,
    };
    function formatProductName(name) {
      // Function to format product names (e.g., "iron_and_steel" to "Iron and Steel")
      return name
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
    Plotly.newPlot("stackedBarChart", plotData, layout, { responsive: true });
    hideLoader();
  }

  function createHeatmap(data) {
    showLoader();

    const { co2_per_product } = data;
    const products = Object.keys(co2_per_product);
    const regions = Object.keys(co2_per_product[products[0]]);

    // Custom colors for Heatmap
    const customColors = [
      "#6b0f01",
      "#a11602",
      "#bc594a",
      "#d79b93",
      "#e4bcb7",
    ];

    // Prepare data for Heatmap
    const heatmapData = {
      x: regions,
      y: products.map((product) => product.replace(/_/g, " ")),
      z: products.map((product) =>
        regions.map((region) => co2_per_product[product][region])
      ),
      type: "heatmap",
      colorscale: customColors.map((color, index) => [
        index / (customColors.length - 1),
        color,
      ]),
      showscale: true,
    };

    const layout = {
      title: "CO2 Emissions Heatmap per Product and Region",
      xaxis: {
        title: "Regions",
        font: { family: "Akkurat Pro Light", size: 10, color: "#0a0a0a" },
      },
      yaxis: {
        title: "Products",
        automargin: true,
        font: { family: "Akkurat Pro Light", size: 10, color: "#0a0a0a" },
      },
      font: { family: "Akkurat Pro Light", size: 11, color: "#0a0a0a" },
      paper_bgcolor: "white",
      plot_bgcolor: "white",
      autosize: true,
      width: document.getElementById("heatmapChart").offsetWidth,
      height: 600,
    };

    Plotly.newPlot("heatmapChart", [heatmapData], layout, { responsive: true });
    hideLoader();
  }
  fetchData().then((data) => {
    populateCountrySelect(data.top_countries_sectors);
    createSankey(data);
    window.addEventListener("resize", () => {
      createSankey(data);
    });

    countrySelect.addEventListener("change", () => {
      createSankey(data);
    });

    resetFilters.addEventListener("click", () => {
      countrySelect.value = "all";
      createSankey(data);
    });
  });

  function populateCountrySelect(top_countries_sectors) {
    top_countries_sectors.forEach((countryData) => {
      const option = document.createElement("option");
      option.value = countryData.country;
      option.textContent = countryData.country;
      countrySelect.appendChild(option);
    });
  }

  function createSankey(data) {
    showLoader();

    const { top_countries_sectors } = data;
    const selectedCountry = countrySelect.value;

    const nodes = [];
    const links = [];

    const sectors = [
      "Aluminium",
      "Cement",
      "Chemicals",
      "Fertilizers",
      "Iron and Steel",
    ];

    // Track node indices
    const countryIndices = {};
    const sectorIndices = {};

    // Filter countries based on the selected country
    const filteredCountries =
      selectedCountry === "all"
        ? top_countries_sectors
        : top_countries_sectors.filter(
            (countryData) => countryData.country === selectedCountry
          );

    // Create nodes for countries
    filteredCountries.forEach((countryData, countryIndex) => {
      countryIndices[countryData.country] = countryIndex;
      nodes.push({ name: countryData.country, color: "#a11602" }); // Shade of orange for countries
    });

    // Create nodes for sectors
    sectors.forEach((sector, sectorIndex) => {
      sectorIndices[sector] = filteredCountries.length + sectorIndex;
      nodes.push({ name: sector, color: "#DC7900" }); // Lighter shade of orange for sectors
    });

    // Create links
    filteredCountries.forEach((countryData) => {
      const countryNodeIndex = countryIndices[countryData.country];
      sectors.forEach((sector) => {
        const sectorNodeIndex = sectorIndices[sector];
        links.push({
          source: countryNodeIndex,
          target: sectorNodeIndex,
          value: countryData.sectors[sector],
        });
      });
    });

    const sankeyData = {
      type: "sankey",
      orientation: "h",
      node: {
        pad: 15,
        thickness: 20,
        line: {
          color: "black",
          width: 0.5,
        },
        label: nodes.map((node) => node.name),
        color: nodes.map((node) => node.color),
      },
      link: {
        source: links.map((link) => link.source),
        target: links.map((link) => link.target),
        value: links.map((link) => link.value),
      },
    };

    const layout = {
      font: { family: "Akkurat Pro Light", size: 11, color: "#0a0a0a" },
      paper_bgcolor: "white",
      plot_bgcolor: "white",
      autosize: true,
      width: document.getElementById("sankeyChart").offsetWidth,
      height: 620,
    };

    Plotly.newPlot("sankeyChart", [sankeyData], layout, { responsive: true });
    hideLoader();
  }
});
