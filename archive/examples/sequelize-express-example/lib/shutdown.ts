import { Server } from "http";

function gracefulShutDown(
  server: Server,
  shutdownInstrumentation: () => Promise<void>,
): () => void {
  return function () {
    console.log("Received kill signal, shutting down gracefully");
    server.close(async () => {
      console.log("Closed out remaining connections");
      await shutdownInstrumentation();
      process.exit(0);
    });

    setTimeout(() => {
      console.error(
        "Could not close connections in time, forcefully shutting down",
      );
      process.exit(1);
    }, 5000);
  };
}

export default function setupShutdown(
  server: Server,
  shutdownInstrumentation: () => Promise<void>,
) {
  process.on("uncaughtException", (err) => {
    console.error(err);
  });

  process.on("SIGTERM", gracefulShutDown(server, shutdownInstrumentation));
  process.on("SIGINT", gracefulShutDown(server, shutdownInstrumentation));
}
