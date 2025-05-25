import log from "log-symbols";

const logger = {
  success: (message: string) => {
    console.log(log.success, message);
  },
  error: (message: string) => {
    console.log(log.error, message);
  },
  info: (message: string) => {
    console.log(log.info, message);
  },
  warning: (message: string) => {
    console.log(log.warning, message);
  },
};

export default logger;
