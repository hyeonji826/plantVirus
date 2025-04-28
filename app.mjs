import express from "express";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { config } from "./config.mjs";
import platsRouter from "./router/plant.mjs";
// import authRouter from "./router/auth.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.static("public"));

app.use(express.json());
app.get("/", (req, res) => {
  fs.readFile(__dirname + "/index.html", (err, data) => {
    if (err) {
      res.status(500);
      return res.send("파일 읽기 오류");
    }
    res.status(200).set({ "Content-Type": "text/html" });
    res.send(data);
  });
});

app.use("/plants", platsRouter);
// app.use("/auth", authRouter);

app.use((req, res, next) => {
  res.sendStatus(404);
});

app.listen(config.host.port, () => {
  console.log("서버 실행 중");
});
