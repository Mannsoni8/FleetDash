import type { ITelemetryReading } from "./telemetry.types.js";

export type WorkerResponse =
    | {
          success: true;
          result: ITelemetryReading;
      }
    | {
          success: false;
          error: string;
      };
