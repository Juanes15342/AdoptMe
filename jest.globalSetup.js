const http = require("http");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(url, (res) => {
          res.resume();
          resolve();
        })
        .on("error", () => {
          if (Date.now() - start > timeoutMs) {
            reject(
              new Error(
                `No hay servidor en ${url}. Ejecuta "npm run dev" en otra terminal antes de correr los tests.`
              )
            );
            return;
          }
          setTimeout(check, 500);
        });
    };
    check();
  });
}

module.exports = async () => {
  await waitForServer(BASE_URL);
  process.env.BASE_URL = BASE_URL;
};
