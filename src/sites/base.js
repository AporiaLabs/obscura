/**
 * Base Site Module
 *
 * This is the base class for all site-specific modules.
 * Each site module should extend this class and implement its methods.
 */

import logger from "../utils/logger.js";
import { getSiteSettings } from "../utils/storage.js";
import OpenRouterAPI from "../api/openRouterAPI.js";

export default class BaseSiteModule {
	/**
	 * Constructor for the base site module
	 * @param {string} siteId - The site identifier
	 */
	constructor(siteId) {
		this.siteId = siteId;
		this.api = null;
		this.settings = null;
		this.initialized = false;
		this.observer = null;
	}

	/**
	 * Initialize the site module
	 * @returns {Promise<boolean>} - Whether initialization was successful
	 */
	async initialize() {
		try {
			// Load settings
			this.settings = await getSiteSettings(this.siteId);
			logger.info(`${this.siteId}Module`, "Initialized with settings", {
				enabled: this.settings.enabled,
				cutoff: this.settings.cutoff,
			});

			// Skip if disabled
			if (!this.settings.enabled) {
				logger.info(`${this.siteId}Module`, "Module is disabled");
				return false;
			}

			// Initialize API
			this.api = new OpenRouterAPI(this.settings.apiKey);

			// Set initialized flag
			this.initialized = true;
			return true;
		} catch (error) {
			logger.error(`${this.siteId}Module`, "Initialization error", error);
			return false;
		}
	}

	/**
	 * Start observing the page for content
	 * This method should be implemented by each site module
	 */
	startObserving() {
		throw new Error(
			"Method 'startObserving' must be implemented by subclasses"
		);
	}

	/**
	 * Stop observing the page
	 */
	stopObserving() {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
			logger.info(`${this.siteId}Module`, "Observer disconnected");
		}
	}

	/**
	 * Process content elements on the page
	 * This method should be implemented by each site module
	 * @param {boolean} ignoreCache - Whether to ignore the cache
	 */
	processElements(ignoreCache = false) {
		throw new Error(
			"Method 'processElements' must be implemented by subclasses"
		);
	}

	/**
	 * Extract data from a content element
	 * This method should be implemented by each site module
	 * @param {HTMLElement} element - The element to extract data from
	 * @returns {Object} - The extracted data
	 */
	extractContentData(element) {
		throw new Error(
			"Method 'extractContentData' must be implemented by subclasses"
		);
	}

	/**
	 * Analyze content using the OpenRouter API
	 * @param {Object} contentData - The content data to analyze
	 * @returns {Promise<Object>} - The analysis result
	 */
	async analyzeContent(contentData) {
		try {
			if (!this.api) {
				logger.error(`${this.siteId}Module`, "API not initialized");
				return null;
			}

			logger.info(`${this.siteId}Module`, "Analyzing content", contentData);

			// Call the API with site-specific context
			const response = await this.api.analyzeVideo(
				this.settings.globalGoals,
				contentData.title || "",
				contentData.author || ""
			);

			return response;
		} catch (error) {
			logger.error(`${this.siteId}Module`, "Error analyzing content", error);
			return null;
		}
	}

	/**
	 * Apply filtering based on analysis result
	 * This method should be implemented by each site module
	 * @param {HTMLElement} element - The element to filter
	 * @param {Object} analysisResult - The analysis result
	 */
	applyFiltering(element, analysisResult) {
		throw new Error(
			"Method 'applyFiltering' must be implemented by subclasses"
		);
	}

	/**
	 * Check if the current URL matches this site
	 * @returns {boolean} - Whether the current URL matches this site
	 */
	static matchesSite(domains) {
		const currentHost = window.location.hostname;
		return domains.some(
			(domain) => currentHost === domain || currentHost.endsWith(`.${domain}`)
		);
	}
}
