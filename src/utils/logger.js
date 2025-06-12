/**
 * Logger utility for consistent logging across the extension
 */

// Log levels
export const LOG_LEVELS = {
	DEBUG: 0,
	INFO: 1,
	WARN: 2,
	ERROR: 3,
	NONE: 4,
};

// Current log level - can be changed at runtime
let currentLogLevel = LOG_LEVELS.INFO;

/**
 * Set the current log level
 * @param {number} level - The log level to set
 */
export const setLogLevel = (level) => {
	if (Object.values(LOG_LEVELS).includes(level)) {
		currentLogLevel = level;
	}
};

/**
 * Log a debug message
 * @param {string} component - The component name
 * @param {string} message - The message to log
 * @param {any} data - Optional data to log
 */
export const debug = (component, message, data) => {
	if (currentLogLevel <= LOG_LEVELS.DEBUG) {
		console.info(
			`[Obscura:${component}] ${message}`,
			data !== undefined ? data : ""
		);
	}
};

/**
 * Log an info message
 * @param {string} component - The component name
 * @param {string} message - The message to log
 * @param {any} data - Optional data to log
 */
export const info = (component, message, data) => {
	if (currentLogLevel <= LOG_LEVELS.INFO) {
		console.info(
			`[Obscura:${component}] ${message}`,
			data !== undefined ? data : ""
		);
	}
};

/**
 * Log a warning message
 * @param {string} component - The component name
 * @param {string} message - The message to log
 * @param {any} data - Optional data to log
 */
export const warn = (component, message, data) => {
	if (currentLogLevel <= LOG_LEVELS.WARN) {
		console.warn(
			`[Obscura:${component}] ${message}`,
			data !== undefined ? data : ""
		);
	}
};

/**
 * Log an error message
 * @param {string} component - The component name
 * @param {string} message - The message to log
 * @param {any} error - Optional error to log
 */
export const error = (component, message, error) => {
	if (currentLogLevel <= LOG_LEVELS.ERROR) {
		console.error(
			`[Obscura:${component}] ${message}`,
			error !== undefined ? error : ""
		);
	}
};

// Export a default logger object
export default {
	setLogLevel,
	debug,
	info,
	warn,
	error,
	levels: LOG_LEVELS,
};
