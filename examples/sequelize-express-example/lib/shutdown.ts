import { Server } from "http";

export default function gracefulShutDown(server: Server): () => void {
  return function () {
    console.log("Received kill signal, shutting down gracefully");
    server.close(async () => {
      console.log("Closed out remaining connections");
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
