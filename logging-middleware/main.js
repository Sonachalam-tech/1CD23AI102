require('dotenv').config();

const API_URL = "http://20.244.56.144/evaluation-service/logs";

let accessToken = process.env.ACCESS_TOKEN;

function updateToken(token) {
  accessToken = token;
}

async function log(stack, level, packageName, message) {
  const logData = {
    stack,
    level,
    package: packageName,
    message,
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(logData),
    });

    if (!response.ok) {
      console.warn(`Logging failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Unable to send log:", error.message);
  }
}

module.exports = {
  updateToken,
  log,
};