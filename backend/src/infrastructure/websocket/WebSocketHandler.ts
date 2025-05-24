import { Server as SocketIOServer, Socket } from "socket.io";
import { StopTestUseCase } from "../../core/use-cases";
import { ILogger } from "../../core/interfaces/common/ILogger";

export class WebSocketHandler {
  constructor(
    private readonly stopTestUseCase: StopTestUseCase,
    private readonly logger: ILogger
  ) {}

  setupSocketHandlers(io: SocketIOServer): void {
    io.on("connection", (socket: Socket) => {
      this.logger.info("Client connected", { socketId: socket.id });

      // Send welcome message
      socket.emit("connection_established", {
        message: "WebSocket connection established successfully",
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });

      // Handle test execution requests (for debugging/feedback)
      socket.on("test_request", (data) => {
        this.logger.debug("Test request received via WebSocket", {
          socketId: socket.id,
          data,
        });

        // Echo back confirmation
        socket.emit("testOutput", {
          type: "log",
          data: `Received test request for: ${
            data.test || "all tests"
          } with profile: ${data.profile || "LIGHT"} (ID: ${
            data.testId || "unknown"
          })`,
          timestamp: new Date().toISOString(),
        });
      });

      // Handle stop test requests
      socket.on("stop_test", async (data) => {
        this.logger.info("Stop test request received via WebSocket", {
          socketId: socket.id,
          testId: data.testId,
        });

        const { testId } = data;
        if (!testId) {
          socket.emit("testOutput", {
            type: "error",
            data: "❌ No test ID provided for stop request",
            timestamp: new Date().toISOString(),
          });
          return;
        }

        try {
          const stopped = await this.stopTestUseCase.execute(testId);

          if (stopped) {
            socket.emit("testOutput", {
              type: "log",
              data: `🛑 Stop request sent for test: ${testId}`,
              timestamp: new Date().toISOString(),
            });
          } else {
            socket.emit("testOutput", {
              type: "error",
              data: `❌ Test ${testId} not found or already completed`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          this.logger.error(
            "Error stopping test via WebSocket",
            error as Error,
            {
              socketId: socket.id,
              testId,
            }
          );

          socket.emit("testOutput", {
            type: "error",
            data: `❌ Error stopping test: ${(error as Error).message}`,
            timestamp: new Date().toISOString(),
          });
        }
      });

      // Handle client disconnect
      socket.on("disconnect", (reason) => {
        this.logger.info("Client disconnected", {
          socketId: socket.id,
          reason,
        });
      });

      // Handle connection errors
      socket.on("error", (error) => {
        this.logger.error("WebSocket error", error, {
          socketId: socket.id,
        });
      });
    });

    // Handle server-level events
    io.on("error", (error) => {
      this.logger.error("Socket.IO server error", error);
    });
  }

  // Utility method for broadcasting to all clients
  broadcastToAll(io: SocketIOServer, event: string, data: any): void {
    io.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}
