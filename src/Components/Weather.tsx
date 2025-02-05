import React, { useEffect, useState } from "react";
import { Bar, Line, Pie, Radar, PolarArea } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Button, useMediaQuery } from "@mui/material";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

const WeatherComponent = () => {
  const [weatherData, setWeatherData] = useState([]);
  const [error, setError] = useState(null);

  const cities = [
    { name: "Buenos Aires", latitude: -34.6037, longitude: -58.3816 },
    { name: "Santiago", latitude: -33.4489, longitude: -70.6693 },
    { name: "Bogotá", latitude: 4.611, longitude: -74.0818 },
    { name: "Lima", latitude: -12.0464, longitude: -77.0428 },
    { name: "Ciudad de México", latitude: 19.4326, longitude: -99.1332 },
    { name: "Caracas", latitude: 10.4915, longitude: -66.9023 },
    { name: "Montevideo", latitude: -34.9011, longitude: -56.1645 },
    { name: "Quito", latitude: -0.2295, longitude: -78.5249 },
    { name: "Asunción", latitude: -25.2637, longitude: -57.5759 },
    { name: "La Paz", latitude: -16.5, longitude: -68.1193 },
    { name: "Guayaquil", latitude: -2.1709, longitude: -79.922 },
  ];

  const fetchWeather = async () => {
    const promises = cities.map(async (city) => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current_weather=true`
        );

        if (!response.ok) {
          throw new Error("Error en la red");
        }

        const data = await response.json();
        return {
          name: city.name,
          temperature: data.current_weather.temperature,
        };
      } catch (error) {
        setError(error.message);
        return null;
      }
    });

    const results = await Promise.all(promises);
    setWeatherData(results.filter((result) => result));
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const handleReload = () => {
    setWeatherData([]);
    setError(null);
    fetchWeather();
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  const chartData = {
    labels: weatherData.map((data) => data.name),
    datasets: [
      {
        label: "Temperatura (°C)",
        data: weatherData.map((data) => data.temperature),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Check if the screen width is small (less than 768px)
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const xs = {
    width: "calc(-5rem + 100vw)",
    marginTop: "1rem",
    marginLeft: "1.5rem",
    borderRadius: "10px",
    height: "calc(-9rem + 100vh)",
    padding: "20px",
    backgroundColor: "white",
    fontFamily: "'Poppins', sans-serif",
    overflow: "auto",
  };
  const xl = {
    width: "calc(100vw - 9rem)",
    marginTop: "2rem",
    marginLeft: "1rem",
    borderRadius: "10px",
    height: "calc(100vh - 10rem)",
    padding: "20px",
    backgroundColor: "white",
    fontFamily: "'Poppins', sans-serif",
    overflow: "auto",
  }
  const value = isSmallScreen ? xs : xl;

  return (
    <div
      style={value}
    >
      <h2 style={{ fontFamily: "'Poppins', sans-serif" }}>
        Clima actual en algunas ciudades de Latinoamérica
        <Button
          style={{
            marginLeft: isSmallScreen ? "0px" : "10px",
            marginTop: isSmallScreen ? "10px" : "0px",
            fontFamily: "'Poppins', sans-serif",
          }}
          variant="outlined"
          color="primary"
          onClick={handleReload}
        >
          Recargar
        </Button>
      </h2>
      {weatherData.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
            flexDirection: isSmallScreen ? "column" : "row", // Use column for small screens and row for larger ones
          }}
        >
          {/* Gráfico de Barras */}
          <div
            style={{
              flex: "1 1 100%", // 100% on small screens
              maxWidth: isSmallScreen ? "100%" : "48%", // Full width on small screens, 48% on large
              overflow: "auto",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            <h3>Gráfico de Barras</h3>
            <Bar
              data={chartData}
              options={{
                responsive: true,
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>

          {/* Gráfico de Líneas */}
          <div
            style={{
              flex: "1 1 100%",
              maxWidth: isSmallScreen ? "100%" : "48%",
              overflow: "auto",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            <h3>Gráfico de Líneas</h3>
            <Line
              data={chartData}
              options={{
                responsive: true,
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>

          {/* Gráfico de Pastel */}
          <div
            style={{
              flex: "1 1 100%",
              maxWidth: isSmallScreen ? "100%" : "48%",
              overflow: "auto",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            <h3>Gráfico de Pastel</h3>
            <Pie
              data={{
                labels: weatherData.map((data) => data.name),
                datasets: [
                  {
                    label: "Temperatura (°C)",
                    data: weatherData.map((data) => data.temperature),
                    backgroundColor: [
                      "rgba(255, 99, 132, 0.6)",
                      "rgba(54, 162, 235, 0.6)",
                      "rgba(255, 206, 86, 0.6)",
                      "rgba(75, 192, 192, 0.6)",
                      "rgba(153, 102, 255, 0.6)",
                      "rgba(255, 159, 64, 0.6)",
                    ],
                  },
                ],
              }}
              options={{ responsive: true }}
            />
          </div>

          {/* Gráfico Radar */}
          <div
            style={{
              flex: "1 1 100%",
              maxWidth: isSmallScreen ? "100%" : "48%",
              overflow: "auto",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            <h3>Gráfico Radar</h3>
            <Radar
              data={{
                labels: weatherData.map((data) => data.name),
                datasets: [
                  {
                    label: "Temperatura (°C)",
                    data: weatherData.map((data) => data.temperature),
                    backgroundColor: "rgba(255, 99, 132, 0.6)",
                    borderColor: "rgba(255, 99, 132, 1)",
                    borderWidth: 1,
                  },
                ],
              }}
              options={{ responsive: true }}
            />
          </div>

          {/* Gráfico Polar */}
          <div
            style={{
              flex: "1 1 100%",
              maxWidth: isSmallScreen ? "100%" : "48%",
              overflow: "auto",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            <h3>Gráfico Polar</h3>
            <PolarArea
              data={{
                labels: weatherData.map((data) => data.name),
                datasets: [
                  {
                    label: "Temperatura (°C)",
                    data: weatherData.map((data) => data.temperature),
                    backgroundColor: [
                      "rgba(255, 99, 132, 0.6)",
                      "rgba(54, 162, 235, 0.6)",
                      "rgba(255, 206, 86, 0.6)",
                      "rgba(75, 192, 192, 0.6)",
                      "rgba(153, 102, 255, 0.6)",
                      "rgba(255, 159, 64, 0.6)",
                    ],
                  },
                ],
              }}
              options={{ responsive: true }}
            />
          </div>
        </div>
      ) : (
        <p style={{ fontFamily: "'Poppins', sans-serif" }}>Cargando...</p>
      )}
    </div>
  );
};

export default WeatherComponent;
