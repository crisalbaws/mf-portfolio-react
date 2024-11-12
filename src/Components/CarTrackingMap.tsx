import React, { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Typography,
  Grid,
} from "@mui/material";

const LeafletMap: React.FC = () => {
  type Agent = {
    position: [number, number];
    route: [number, number][];
    color: string;
    marker?: L.Marker<any>;
    polyline?: L.Polyline<any>;
    hasReachedDestination: boolean;
    startTime: number;
  };

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<number>(-1);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker<any>[]>([]);
  const polylinesRef = useRef<L.Polyline<any>[]>([]);
  const agentColors = ["red", "green", "blue"];
  const RADIUS = 0.05;

  const getRandomDestination = (start: [number, number]): [number, number] => {
    const randomLat = start[0] + (Math.random() - 0.5) * RADIUS;
    const randomLng = start[1] + (Math.random() - 0.5) * RADIUS;
    return [randomLat, randomLng];
  };

  const fetchRoute = async (
    start: [number, number],
    end: [number, number]
  ): Promise<[number, number][]> => {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const coordinates = data.routes[0].geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]]
      );
      return coordinates;
    } catch (error) {
      console.error("Error fetching route:", error);
      return [];
    }
  };

  const simulateAgentMovement = (index: number) => {
    setAgents((prevAgents) => {
      const newAgents = [...prevAgents];
      const agent = { ...newAgents[index] };
      if (agent.route.length > 0) {
        const nextPosition = agent.route[0];
        agent.position = nextPosition;
        agent.route = agent.route.slice(1);
        if (agent.marker) {
          agent.marker.setLatLng(agent.position);
        }
        if (agent.route.length === 0) {
          agent.hasReachedDestination = true;
        }
      }
      newAgents[index] = agent;
      return newAgents;
    });
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const initialPosition1: [number, number] = [latitude, longitude];
        const agentDestinations = [
          getRandomDestination(initialPosition1),
          getRandomDestination([latitude + 0.01, longitude + 0.01]),
          getRandomDestination([latitude - 0.01, longitude - 0.01]),
        ];
        const agentInitialPositions = [
          [latitude, longitude],
          [latitude + 0.027, longitude + 0.027],
          [latitude - 0.027, longitude - 0.027],
        ];

        const initialAgents = await Promise.all(
          agentInitialPositions.map(async (position: any, index) => {
            const route = await fetchRoute(position, agentDestinations[index]);
            return {
              position,
              route,
              color: agentColors[index % agentColors.length],
              hasReachedDestination: false,
              startTime: Date.now(),
            };
          })
        );

        setAgents(initialAgents);
      },
      (error) => {
        console.error("Error retrieving location", error);
        setAgents([
          {
            position: [51.505, -0.09],
            route: [],
            color: agentColors[0],
            hasReachedDestination: false,
            startTime: Date.now(),
          },
          {
            position: [51.515, -0.08],
            route: [],
            color: agentColors[1],
            hasReachedDestination: false,
            startTime: Date.now(),
          },
          {
            position: [51.495, -0.1],
            route: [],
            color: agentColors[2],
            hasReachedDestination: false,
            startTime: Date.now(),
          },
        ]);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    if (!mapRef.current && agents.length > 0) {
      const bounds = L.latLngBounds(agents.map((agent) => agent.position));
      mapRef.current = L.map("map").fitBounds(bounds);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors - This project is a simulation',
      }).addTo(mapRef.current);
    }

    markersRef.current.forEach((marker) => {
      mapRef.current?.removeLayer(marker);
    });
    polylinesRef.current.forEach((polyline) => {
      mapRef.current?.removeLayer(polyline);
    });

    markersRef.current = agents
      .map((agent, index) => {
        if (selectedAgent !== -1 && selectedAgent !== index) {
          return null;
        }

        const marker = L.marker(agent.position, {
          icon: L.divIcon({
            className: "custom-icon",
            html: `<div style="background-color: ${agent.color}; width: 10px; height: 10px; border-radius: 50%;"></div>`,
          }),
        }).addTo(mapRef.current!);

        marker
          .bindTooltip(`Agente ${index + 1}`, {
            permanent: true,
            direction: "top",
            className: "custom-tooltip",
          })
          .openTooltip();
        marker.on("click", () => {
          const position: any = [
            agents[index]?.position[0],
            agents[index]?.position[1],
          ];
          mapRef.current.setView(position, 17);
        });

        const polyline = L.polyline(agent.route, { color: agent.color }).addTo(
          mapRef.current!
        );
        polylinesRef.current.push(polyline);

        if (agent.route.length > 0) {
          const destinationMarker = L.marker(
            agent.route[agent.route.length - 1],
            {
              icon: L.divIcon({
                className: "destination-icon",
                html: `<div style="background-color: yellow; width: 10px; height: 10px; border-radius: 50%;"></div>`,
              }),
            }
          ).addTo(mapRef.current!);
          destinationMarker
            .bindTooltip(`Destino Agente ${index + 1}`, {
              permanent: true,
              direction: "top",
              className: "destination-tooltip",
            })
            .openTooltip();
        }

        return marker;
      })
      .filter(Boolean);

    const interval = setInterval(() => {
      agents.forEach((_, index) => {
        simulateAgentMovement(index);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [agents, selectedAgent]);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <FormControl
        variant="outlined"
        style={{ marginLeft: "2%", marginTop: "20px", width: "300px" }}
      >
        <InputLabel>Seleccionar Agente</InputLabel>
        <Select
          value={selectedAgent}
          onChange={(event) => setSelectedAgent(event.target.value as number)}
          label="Seleccionar Agente"
        >
          <MenuItem value={-1}>Todos</MenuItem>
          {agents.map((_, index) => (
            <MenuItem key={index} value={index}>
              Agente {index + 1}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Grid
        container
        spacing={2}
        style={{
          paddingTop: "25px",
          paddingLeft: "25px",
          paddingRight: "25px",
        }}
      >
        {agents.map((agent, index) => {
          const startTime = new Date(agent.startTime);
          const endTime = new Date(
            startTime.getTime() +
              (agent.hasReachedDestination ? 0 : Date.now() - agent.startTime)
          );
          const status = agent.hasReachedDestination ? "Terminado" : "En ruta";
          const elapsedTime = Math.floor(
            (endTime.getTime() - startTime.getTime()) / 1000
          );

          return (
            <Grid item xs={12} sm={4} key={index}>
              <Card
                style={{
                  borderRadius: "10px",
                  boxShadow: "#00000017 0px 0px 3px 3px",
                }}
                variant="outlined"
              >
                <CardContent>
                  <Typography variant="h6">Agente {index + 1}</Typography>
                  <Typography variant="body1">
                    Inicio: {startTime.toLocaleTimeString()}
                  </Typography>
                  <Typography variant="body1">
                    Fin: {endTime.toLocaleTimeString()}
                  </Typography>
                  <Typography variant="body1">
                    Tiempo: {elapsedTime} s
                  </Typography>
                  <Typography variant="body1">Estatus: {status}</Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <div
        style={{
          display: "flex",
          width: "95vw",
          height: "48vh",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        <div id="map" style={{ width: "91vw", height: "40vh" }}></div>
      </div>
    </div>
  );
};

export default LeafletMap;
