import { Router } from "express";
import { HealthController } from "../controllers/HealthController";

export class HealthRoutes {
  constructor(private readonly controller: HealthController) {}

  getRouter(): Router {
    const router = Router();
    router.get("/", this.controller.checkHealth);
    return router;
  }
}
