import { Router } from "express";
import { TestResultController } from "../controllers/TestResultController";
import { ValidationMiddleware } from "../middleware/ValidationMiddleware";

export class TestResultRoutes {
  constructor(private readonly controller: TestResultController) {}

  getRouter(): Router {
    const router = Router();

    router.get("/", this.controller.getDirectories);

    router.get(
      "/:directory",
      ValidationMiddleware.validateParams([
        { field: "directory", required: true, type: "string" },
      ]),
      this.controller.getFiles
    );

    router.get(
      "/:directory/:file",
      ValidationMiddleware.validateParams([
        { field: "directory", required: true, type: "string" },
        { field: "file", required: true, type: "string" },
      ]),
      this.controller.getResult
    );

    return router;
  }
}
