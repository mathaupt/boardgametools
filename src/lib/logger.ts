import pino from "pino";
import { env } from "@/lib/env";

const logger = pino({
  level: process.env.LOG_LEVEL || (env.NODE_ENV === "production" ? "info" : "debug"),
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
