import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
//import fetch from "node-fetch";

const app = express();
let port = process.env.PORT || 3001;

app.use(cors());

app.get("/", (req, res) => {
  res.send("We are good to go chief! oh yeah mr crabs");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders:
      "Content-Type, Authorization, X-Requested-With, X-Socket-ID",
    credentials: true,
    maxAge: "86400",
  },
});

const turnedOnLights = []; // Array to save lights that are turned on

io.on("connection", (socket) => {
  console.log("socket id", socket.id);

  socket.on("current_location", (data) => {
    console.log("current_location", data);
    checkCloseLights(data);
  });

  socket.on("disconnect", () => {
    console.log("socket disconnected", socket.id);
  });
});

const checkCloseLights = (data) => {
  const lightsArr = [
    {
      id: "hs-6lp0eqG7aT3hzAAAH",
      lat: 28.6740282,
      lng: -106.08093589999999,
    },
  ];
  const distance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1); // deg2rad below
    const dLon = deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    io.emit("close_light_distance", Math.round(d * 1000));
    return d;
  };
  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };
  const isClose = (lat1, lng1, lat2, lng2) => {
    return distance(lat1, lng1, lat2, lng2) < 0.06; // distance to the light in km
  };
  const isCloseLight = (light) => {
    return isClose(data.lat, data.lng, light.lat, light.lng);
  };
  const closeLights = lightsArr.filter(isCloseLight);
  console.log("closeLights", closeLights);
  if (closeLights.length > 0) {
    closeLights.forEach((light) => {
      if (turnedOnLights.includes(light.id)) return;
      io.emit("switch_light", 2);
      turnedOnLights.push(light.id);
    });
    console.log("turnedOnLights", turnedOnLights);
  } else {
    turnedOnLights.forEach((light) => {
      console.log("turnedOnLights not close", turnedOnLights);
      turnedOnLights.splice(turnedOnLights.indexOf(light.id), 1);
      io.emit("switch_light", 1);
    });
  }
};

server.listen(port, () => {
  console.log("Server running on port ${port}");
});


