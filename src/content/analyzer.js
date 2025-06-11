/**
 * Video analyzer module
 * Handles the analysis of YouTube videos using the OpenRouter API
 */

import OpenRouterAPI from "../api/openRouterAPI.js";
import { UI_CONFIG } from "../config/settings.js";
import {
	applyScanningPlaceholder,
	removeScanningPlaceholder,
	changePlaceholder,
	extractVideoData,
} from "./domHandler.js";
import logger from "../utils/logger.js";
import { dataSelectors } from "./selectors.js";

let api = null;
let userGoals = "";
let probabilityCutoff = 60;

/**
 * Initialize the analyzer with user settings
 * @param {string} apiKey - The OpenRouter API key
 * @param {string} goals - The user's goals
 * @param {number} cutoff - The probability cutoff
 */
export const initializeAnalyzer = (apiKey, goals, cutoff) => {
	api = new OpenRouterAPI(apiKey);
	userGoals = goals;
	probabilityCutoff = cutoff;

	logger.info("Analyzer", "Initialized with settings", {
		goalsLength: goals.length,
		cutoff,
	});

	return api;
};

/**
 * Process a YouTube element
 * @param {HTMLElement} element - The element to process
 * @param {boolean} ignoreCache - Whether to ignore the cache
 */
export const processElement = async (element, ignoreCache = false) => {
	// Skip if already processed and not ignoring cache
	if (element.dataset.scanned && !ignoreCache) {
		return;
	}

	// Mark as scanned
	element.dataset.scanned = "true";

	// Apply placeholder
	applyScanningPlaceholder(element);

	// Analyze the element
	await analyzeVideoElement(element);
};

/**
 * Analyze a YouTube video element
 * @param {HTMLElement} element - The element to analyze
 */
const analyzeVideoElement = async (element) => {
	try {
		// Check if API is initialized
		if (!api) {
			logger.error("Analyzer", "API not initialized");
			changePlaceholder(element, "API not initialized");
			return;
		}

		// Extract video data
		const data = extractVideoData(element, dataSelectors);

		// Skip if missing essential data
		if (!data.title || !data.channelName) {
			logger.warn("Analyzer", "Missing essential data", data);
			removeScanningPlaceholder(element);
			return;
		}

		// Call the API
		logger.info("Analyzer", "Analyzing video", {
			title: data.title,
			channel: data.channelName,
		});
		const response = await api.analyzeVideo(
			userGoals,
			data.title,
			data.channelName
		);

		// Process the response
		if (response && typeof response.probability === "number") {
			logger.info("Analyzer", "Analysis result", {
				title: data.title,
				probability: response.probability,
				cutoff: probabilityCutoff,
			});

			if (response.probability > probabilityCutoff) {
				// Good video, remove placeholder
				removeScanningPlaceholder(element);
			} else {
				// Keep placeholder, effectively hiding it
				changePlaceholder(element);
			}
		} else {
			// On failure, show the video anyway
			logger.warn("Analyzer", "Invalid API response", response);
			changePlaceholder(element, UI_CONFIG.API_ERROR_TEXT);
		}
	} catch (err) {
		logger.error("Analyzer", "Error analyzing element", err);
		changePlaceholder(element, UI_CONFIG.ERROR_TEXT);
	}
};

export default {
	initializeAnalyzer,
	processElement,
};
