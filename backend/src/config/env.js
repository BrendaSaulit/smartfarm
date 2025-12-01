module.exports = {
  ESP32_BASE: process.env.ESP32_BASE || "http://10.106.33.1",
  JWT_SECRET: process.env.JWT_SECRET || "smartfarm_secret",
  PORT: process.env.PORT || 3001
};