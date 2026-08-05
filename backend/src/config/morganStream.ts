import {logger} from "./logger";

export const morganStream = {
  write: (message: string) => {
    logger.help(`HTTP Request: ${message.trim()}`);
    logger.info(message.trim());
  },
};