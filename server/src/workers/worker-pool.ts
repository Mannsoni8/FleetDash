import { Worker } from "node:worker_threads";
import { availableParallelism } from "node:os";

import type { TelemetryRequestBody } from "../types/telemetry-request.types.js";
import type { ITelemetryReading } from "../types/telemetry.types.js";
import type { WorkerResponse } from "../types/telemetry-worker.types.js";

interface Task {
    data: TelemetryRequestBody;
    resolve: (result: ITelemetryReading) => void;
    reject: (error: Error) => void;
}

interface WorkerSlot {
    worker: Worker;
    busy: boolean;
    currentTask: Task | undefined;
    failed: boolean;
}

export class TelemetryWorkerPool {
    private readonly workers: WorkerSlot[] = [];
    private readonly queue: Task[] = [];
    private closed = false;

    constructor(
         size = Math.max(
            1,
            Math.min(4, availableParallelism() - 1),
        ),
        private readonly maxQueueSize = 1000,
    ) {
        if (!Number.isInteger(size) || size < 1) {
            throw new Error("Worker pool size must be a positive integer");
        }

        if (!Number.isInteger(maxQueueSize) || maxQueueSize < 1) {
            throw new Error("Queue size must be a positive integer");
        }

        for (let i = 0; i < size; i++) {
            this.createWorker();
        }
    }

    private createWorker(): void {
        const isTypeScript = import.meta.url.endsWith(".ts");

        const workerUrl = new URL(
            isTypeScript
                ? "./telemetry.worker.ts"
                : "./telemetry.worker.js",
            import.meta.url,
        );

        const worker = new Worker(workerUrl, {
            execArgv: isTypeScript
                ? ["--import", "tsx"]
                : process.execArgv,
        });

        const slot: WorkerSlot = {
            worker,
            busy: false,
            currentTask: undefined,
            failed: false,
        };

        this.workers.push(slot);

        worker.on("message", (response: WorkerResponse) => {
            const task = slot.currentTask;

            if (!task || slot.failed) {
                return;
            }

            slot.currentTask = undefined;
            slot.busy = false;

            if (response.success) {
                task.resolve(response.result);
            } else {
                task.reject(new Error(response.error));
            }

            this.runNext();
        });

        worker.on("error", (error: Error) => {
            this.handleWorkerFailure(slot, error);
        });

        worker.on("exit", (code: number) => {
            if (!this.closed && !slot.failed) {
                this.handleWorkerFailure(
                    slot,
                    new Error(
                        `Telemetry worker exited unexpectedly with code ${code}`,
                    ),
                );
            }
        });
    }

    process(data: TelemetryRequestBody): Promise<ITelemetryReading> {
        if (this.closed) {
            return Promise.reject(
                new Error("Telemetry worker pool is closed"),
            );
        }

        if (this.queue.length >= this.maxQueueSize) {
            return Promise.reject(
                new Error("Telemetry worker queue is full"),
            );
        }

        return new Promise<ITelemetryReading>((resolve, reject) => {
            this.queue.push({ data, resolve, reject });
            this.runNext();
        });
    }

    private runNext(): void {
        if (this.closed) {
            return;
        }

        while (this.queue.length > 0) {
            const slot = this.workers.find(
                (workerSlot) =>
                    !workerSlot.busy && !workerSlot.failed,
            );

            if (!slot) {
                return;
            }

            const task = this.queue.shift();

            if (!task) {
                return;
            }

            slot.busy = true;
            slot.currentTask = task;

            try {
                slot.worker.postMessage(task.data);
            } catch (error) {
                this.handleWorkerFailure(
                    slot,
                    error instanceof Error
                        ? error
                        : new Error("Failed to send task to worker"),
                );
            }
        }
    }

    private handleWorkerFailure(
        slot: WorkerSlot,
        error: Error,
    ): void {
        if (slot.failed) {
            return;
        }

        slot.failed = true;

        if (slot.currentTask) {
            slot.currentTask.reject(error);
            slot.currentTask = undefined;
        }

        slot.busy = false;

        const index = this.workers.indexOf(slot);

        if (index !== -1) {
            this.workers.splice(index, 1);
        }

        void slot.worker.terminate();

        if (!this.closed) {
            try {
                this.createWorker();
            } catch (replacementError) {
                console.error(
                    "Failed to replace telemetry worker:",
                    replacementError,
                );
            }

            this.runNext();
        }
    }

    async close(): Promise<void> {
        if (this.closed) {
            return;
        }

        this.closed = true;

        const shutdownError = new Error(
            "Telemetry worker pool is shutting down",
        );

        for (const task of this.queue.splice(0)) {
            task.reject(shutdownError);
        }

        const workers = [...this.workers];
        this.workers.length = 0;

        await Promise.all(
            workers.map(async (slot) => {
                if (slot.currentTask) {
                    slot.currentTask.reject(shutdownError);
                    slot.currentTask = undefined;
                }

                slot.failed = true;
                await slot.worker.terminate();
            }),
        );
    }
}
