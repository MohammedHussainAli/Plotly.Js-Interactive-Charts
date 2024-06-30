document.addEventListener("DOMContentLoaded", function () {
  const loader = document.getElementById("loader");
  const monthSelect = document.getElementById("monthSelect");

  function showLoader() {
    loader.style.display = "block";
  }

  function hideLoader() {
    loader.style.display = "none";
  }

  // Fetching Data from JSON (Simulating the api call)
  function fetchData() {
    return axios
      .get("/assets/Json/carbon-prices.json")
      .then((response) => response.data)
      .catch((error) => {
        console.error("Error fetching data:", error);
        return [];
      });
  }

  // Filter Dropdown Functions
  // (Sorting months in format)
  function populateMonthDropdown(dates) {
    // Clear existing options
    monthSelect.innerHTML = "";

    const uniqueMonths = [...new Set(dates.map((date) => date.slice(0, 7)))];

    uniqueMonths.forEach((month) => {
      const date = new Date(month + "-01");
      const formattedMonth = date.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      const option = document.createElement("option");
      option.value = month;
      option.textContent = formattedMonth;
      monthSelect.appendChild(option);
    });
  }

  //Filtering based on Months
  function filterDataByMonth(data, month) {
    return data.filter((d) => d.date.startsWith(month));
  }

  //Price Trends updating function
  function updateLineChart(data) {
    const dates = data.map((d) => d.date);
    const chinaPrices = data.map((d) => d.china);
    const euPrices = data.map((d) => d.eu);
    const skPrices = data.map((d) => d.south_korea);
    const usPrices = data.map((d) => d.us_california);

    const trace1 = {
      x: dates,
      y: chinaPrices,
      type: "scatter",
      mode: "lines",
      name: "China",
      line: { color: "#862b00" }, // Orange 7
    };
    const trace2 = {
      x: dates,
      y: euPrices,
      type: "scatter",
      mode: "lines",
      name: "EU",
      line: { color: "#c94100" }, // Orange 5
    };
    const trace3 = {
      x: dates,
      y: skPrices,
      type: "scatter",
      mode: "lines",
      name: "South Korea",
      line: { color: "#d87749" }, // Orange 3
    };
    const trace4 = {
      x: dates,
      y: usPrices,
      type: "scatter",
      mode: "lines",
      name: "US California",
      line: { color: "#e8ae92" }, // Orange 2
    };

    const plotData = [trace1, trace2, trace3, trace4];

    const layout = {
      // title: "Carbon Price Trends",
      xaxis: {
        type: "date",
        title: "Date",
        autorange: true,
        rangeselector: {
          buttons: [
            {
              count: 3,
              label: "Last 3-months",
              step: "month",
              stepmode: "backward",
            },
            {
              count: 6,
              label: "Last 6-months",
              step: "month",
              stepmode: "backward",
            },
            {
              label: "All",
              step: "all",
            },
          ],
          x: 0.3,
          y: 1.3,
          xanchor: "left",
          yanchor: "top",
          font: { size: 10 },
        },
        rangeslider: {
          range: [dates[0], dates[dates.length - 1]],
          visible: true,
        },
        tickfont: { family: "Akkurat LL Light", size: 10, color: "#0a0a0a" },
      },
      yaxis: {
        title: "Price",
        autorange: true,
        type: "linear",
        tickfont: { family: "Akkurat LL Light", size: 10, color: "#0a0a0a" },
        rangemode: "tozero",
      },
      font: { family: "Akkurat Pro Light", size: 11, color: "#0a0a0a" },
      showlegend: true,
      legend: {
        orientation: "h",
        y: 1.02,
        x: 0.5,
        xanchor: "center",
        yanchor: "bottom",
      },
      grid: {
        xaxis: {
          showgrid: true,
          gridcolor: "#d0d2d3",
          gridwidth: 0.25,
        },
        yaxis: {
          showgrid: false,
          gridcolor: "#d0d2d3",
          gridwidth: 0.25,
        },
      },
    };

    var config = { responsive: true };
    Plotly.newPlot("priceTrendsChart", plotData, layout, config);
  }

  //Compparative chart updating function
  function updateBarChart(data) {
    const selectedMonth = monthSelect.value;
    const monthData = filterDataByMonth(data, selectedMonth);

    // Calculate the number of weeks in the selected month
    const yearMonth = selectedMonth.split("-");
    const daysInMonth = new Date(yearMonth[0], yearMonth[1], 0).getDate();
    const weeksInMonth = Math.ceil(daysInMonth / 7);

    // Generate dates array for the entire month grouped by weeks
    const datesInMonth = Array.from({ length: weeksInMonth }, (_, i) => {
      const weekNumber = i + 1;
      return `${getMonthName(yearMonth[1])}-${yearMonth[0].slice(
        2
      )} (Week-${weekNumber})`;
    });

    function getMonthName(month) {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return months[parseInt(month, 10) - 1];
    }

    const countries = ["china", "eu", "south_korea", "us_california"];
    const countryNames = {
      china: "China",
      eu: "EU",
      south_korea: "South Korea",
      us_california: "US California",
    };
    const colors = ["#862b00", "#c94100", "#d87749", "#e8ae92"]; // Orange 7, Orange 5, Orange 3, Orange 2

    const barData = countries.map((country, index) => ({
      x: datesInMonth,
      y: datesInMonth.map((week, index) => {
        const weekStart = index * 7 + 1;
        const weekEnd = Math.min((index + 1) * 7, daysInMonth);
        const weeklySum = monthData.reduce((acc, curr) => {
          const dateDay = parseInt(curr.date.split("-")[2]);
          if (dateDay >= weekStart && dateDay <= weekEnd) {
            return acc + curr[country];
          }
          return acc;
        }, 0);
        return weeklySum > 0 ? weeklySum : null;
      }),
      type: "bar",
      name: countryNames[country],
      marker: {
        color: colors[index],
      },
    }));

    const layout = {
      // title: "Comparative Carbon Prices",
      xaxis: {
        title: "Weeks",
        type: "category",
        tickfont: { family: "Akkurat LL Light", size: 10, color: "#0a0a0a" },
      },
      yaxis: {
        title: "Price",
        type: "linear",
        tickfont: { family: "Akkurat LL Light", size: 10, color: "#0a0a0a" },
        rangemode: "tozero",
      },
      font: { family: "Akkurat Pro Light", size: 11, color: "#0a0a0a" },
      showlegend: true,
      legend: {
        orientation: "h",
        y: 1.02,
        x: 0.5,
        xanchor: "center",
        yanchor: "bottom",
      },
      grid: {
        xaxis: {
          showgrid: true,
          gridcolor: "#d0d2d3",
          gridwidth: 0.25,
        },
        yaxis: {
          showgrid: false,
          gridcolor: "#d0d2d3",
          gridwidth: 0.25,
        },
      },
    };

    var config = { responsive: true };
    Plotly.newPlot("comparativeBarChart", barData, layout, config);
  }

  //Flow Distribution updating function
  function updateBoxPlot(data, month = null) {
    const countries = ["china", "eu", "south_korea", "us_california"];
    const countryNames = {
      china: "China",
      eu: "EU",
      south_korea: "South Korea",
      us_california: "US California",
    };
    const boxData = countries.map((country) => {
      const prices = data.map((d) => d[country]);
      return {
        y: prices,
        type: "box",
        name: countryNames[country],
        boxpoints: "all",
        jitter: 0.5,
        whiskerwidth: 0.2,
        fillcolor: getCountryColor(country),
        marker: {
          size: 2,
        },
        line: {
          width: 1,
        },
        hoverinfo: "y+name", // Show price and country name on hover
      };
    });

    const layout = {
      title: `Carbon Price Distribution for ${month ? month : "Entire Year"}`,
      xaxis: {
        title: "Countries",
        tickangle: 0,
        tickfont: { family: "Akkurat LL Light", size: 10, color: "#0a0a0a" },
      },
      yaxis: {
        title: "Price",
        type: "linear",
        tickfont: { family: "Akkurat LL Light", size: 10, color: "#0a0a0a" },
      },
      font: { family: "Akkurat Pro Light", size: 11, color: "#0a0a0a" },
      showlegend: true,
      legend: {
        orientation: "h",
        y: 1.02,
        x: 0.5,
        xanchor: "center",
        yanchor: "bottom",
      },
      grid: {
        xaxis: {
          showgrid: true,
          gridcolor: "#d0d2d3",
          gridwidth: 0.25,
        },
        yaxis: {
          showgrid: true,
          gridcolor: "#d0d2d3",
          gridwidth: 0.25,
        },
      },
    };

    var config = { responsive: true };
    Plotly.newPlot("boxPlotChart", boxData, layout, config);
  }

  //Common Colors updating function
  function getCountryColor(country) {
    const colors = {
      china: "#862b00", // Orange 7
      eu: "#c94100", // Orange 5
      south_korea: "#d87749", // Orange 3
      us_california: "#e8ae92", // Orange 2
    };
    return colors[country] || "#000000"; // Default color if not found
  }

  //Tree-map updating function
  function updateTreemap(data, month = null) {
    const selectedMonth = month ? month : monthSelect.value;
    const monthData = month ? filterDataByMonth(data, month) : data;

    const countries = ["china", "eu", "south_korea", "us_california"];
    const countryNames = {
      china: "China",
      eu: "EU",
      south_korea: "South Korea",
      us_california: "US California",
    };

    // Calculate total prices for each country
    const totalPrices = countries.map((country) => {
      const totalPrice = monthData.reduce((acc, d) => acc + d[country], 0);
      return {
        name: countryNames[country],
        value: totalPrice,
      };
    });

    // Sort by total price descending
    totalPrices.sort((a, b) => b.value - a.value);

    const treemapData = [
      {
        type: "treemap",
        labels: totalPrices.map((country) => country.name),
        parents: totalPrices.map(() => ""), // All nodes are root nodes
        values: totalPrices.map((country) => country.value),
        textinfo: "label+value",
        hoverinfo: "all",
        marker: {
          colors: [
            getCountryColor("china"),
            getCountryColor("eu"),
            getCountryColor("south_korea"),
            getCountryColor("us_california"),
          ],
          line: {
            width: 1,
            color: "#FFFFFF", // Add white border for better contrast
          },
        },
      },
    ];

    const title = month
      ? `Carbon Flow Visualization for ${new Date(month + "-01").toLocaleString(
          "default",
          { month: "short", year: "2-digit" }
        )}`
      : "Carbon Flow Visualization for Entire Year";

    const layout = {
      title: {
        text: title,
        font: {
          family: "Akkurat Pro Light",
          size: 18,
          color: "#333", // Darker title color for contrast
        },
        x: 0.5, // Center title horizontally
        xanchor: "center",
      },
      margin: {
        t: 80, // Increase top margin for title space
        l: 20,
        r: 20,
        b: 20,
      },
      font: {
        family: "Akkurat Pro Light",
        size: 11,
        color: "#666", // Lighter font color for contrast
      },
      treemapcolorway: [
        getCountryColor("china"),
        getCountryColor("eu"),
        getCountryColor("south_korea"),
        getCountryColor("us_california"),
      ],
      hoverlabel: {
        bgcolor: "#FFF",
        font: {
          family: "Akkurat Pro Light",
          size: 12,
          color: "#333",
        },
      },
    };

    var config = { responsive: true };
    Plotly.newPlot("treemapChart", treemapData, layout, config);
  }

  //Reset button
  function resetCharts() {
    fetchData().then((data) => {
      populateMonthDropdown(data.map((d) => d.date));
      updateLineChart(data);
      updateBarChart(data);
      updateBoxPlot(data); // Initialize with full year data
      updateTreemap(data); // Initialize with full year data
      monthSelect.selectedIndex = 0; // Reset month dropdown to default option
    });
  }

  ///Initialising all the charts here.....
  function initializeCharts() {
    showLoader();

    fetchData()
      .then((data) => {
        if (data.length > 0) {
          populateMonthDropdown(data.map((d) => d.date));
          updateLineChart(data);
          updateBarChart(data);
          updateBoxPlot(data);
          updateTreemap(data); // Initialize with full year data

          document
            .getElementById("monthSelect")
            .addEventListener("change", function () {
              const selectedMonth = this.value;
              const filteredData = filterDataByMonth(data, selectedMonth);
              updateLineChart(filteredData);
              updateBarChart(filteredData); // Update bar chart with filtered data
              const formattedMonth = new Date(
                selectedMonth + "-01"
              ).toLocaleString("default", { month: "short", year: "2-digit" });
              updateBoxPlot(filteredData, formattedMonth); // Update box plot with filtered month
              updateTreemap(filteredData, selectedMonth); // Update heatmap with filtered month
            });

          document
            .getElementById("resetFilters")
            .addEventListener("click", resetCharts);
        } else {
          console.error("No data available.");
        }
      })
      .finally(() => {
        hideLoader();
      });
  }

  initializeCharts();
});
