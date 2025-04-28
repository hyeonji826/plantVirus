// 사용자 api
import express from "express";
import * as plantController from "../controller/plant.mjs";

const router = express.Router();

router.get("/region", plantController.getRegion);
router.get("/virus", plantController.getCropVirus);

export default router;
