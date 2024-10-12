import { createLogger, format, transports } from 'winston';

// Define log formats
const { combine, timestamp, printf, colorize, errors } = format;

// Custom log format for output
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`; // Print the stack trace if it exists
});

// Create the Winston logger instance
const logger = createLogger({
  level: 'info', // Default log level
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Add timestamp to logs
    errors({ stack: true }), // Catch and log errors with stack traces
    logFormat // Use custom format for output
  ),
  transports: [
    new transports.Console({ format: combine(colorize(), logFormat) }), // Print to console
    new transports.File({ filename: 'logs/app.log' }), // Log to file
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'logs/exceptions.log' }), // Log uncaught exceptions to a file
  ],
});

export default logger;
