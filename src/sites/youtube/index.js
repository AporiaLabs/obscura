/**
 * YouTube module for Obscura
 * Handles the filtering of YouTube content based on user goals
 */

import BaseSiteModule from "../base.js";
import OpenRouterAPI from "../../api/openRouterAPI.js";
import { UI_CONFIG } from "../../config/settings.js";
import { youtubeSelectors } from "../../content/selectors.js";
import logger from "../../utils/logger.js";
import { getSiteSettings } from "../../utils/storage.js";

export default class YouTubeModule extends BaseSiteModule {
	constructor() {
		super("youtube");
		this.observer = null;
		this.api = null;
		this.userGoals = "";
		this.probabilityCutoff = 60;
		this.processedElements = new Set();
	}

	/**
	 * Initialize the YouTube module
	 * @returns {Promise<boolean>} - Whether initialization was successful
	 */
	async initialize() {
		// Get site settings
		const settings = await getSiteSettings("youtube");
		if (!settings.enabled) {
			logger.info("YouTubeModule", "YouTube module is disabled");
			return false;
		}

		if (!settings.apiKey) {
			logger.warn("YouTubeModule", "No API key found");
			return false;
		}

		// Initialize API
		this.api = new OpenRouterAPI(settings.apiKey);
		this.userGoals = settings.contentPreference || settings.globalGoals;
		this.probabilityCutoff = settings.cutoff || 60;

		logger.info("YouTubeModule", "Initialized with settings", {
			goalsLength: this.userGoals.length,
			cutoff: this.probabilityCutoff,
		});

		return true;
	}

	/**
	 * Start observing the DOM for YouTube content
	 */
	startObserving() {
		logger.info("YouTubeModule", "Starting YouTube observer");

		// Process existing content first
		this.processExistingContent();

		// Create a MutationObserver to watch for new videos
		this.observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
					this.processNewContent(mutation.addedNodes);
				}
			}
		});

		// Start observing the document body
		this.observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
		logger.info("YouTubeModule", "Observing document body");
	}

	/**
	 * Stop observing the DOM
	 */
	stopObserving() {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
			logger.info("YouTubeModule", "Stopped YouTube observer");
		}
	}

	/**
	 * Process existing content on the page
	 */
	processExistingContent() {
		logger.info("YouTubeModule", "Processing existing content");

		// Process content containers
		youtubeSelectors.contentContainers.forEach((selector) => {
			const elements = document.querySelectorAll(selector);
			elements.forEach((element) => {
				this.processElement(element);
			});
		});
	}

	/**
	 * Process new content added to the DOM
	 * @param {NodeList} addedNodes - The nodes added to the DOM
	 */
	processNewContent(addedNodes) {
		addedNodes.forEach((node) => {
			if (node.nodeType === Node.ELEMENT_NODE) {
				// Check if this node is a content container
				const isContainer = youtubeSelectors.contentContainers.some(
					(selector) => node.matches(selector)
				);
				if (isContainer) {
					this.processElement(node);
					return;
				}

				// Otherwise check for containers within this node
				youtubeSelectors.contentContainers.forEach((selector) => {
					const elements = node.querySelectorAll(selector);
					elements.forEach((element) => {
						this.processElement(element);
					});
				});
			}
		});
	}

	/**
	 * Process a single element
	 * @param {HTMLElement} element - The element to process
	 * @param {boolean} ignoreCache - Whether to ignore the processed cache
	 */
	async processElement(element, ignoreCache = false) {
		// Skip if already processed and not ignoring cache
		if (this.processedElements.has(element) && !ignoreCache) {
			return;
		}

		// Mark as processed
		this.processedElements.add(element);

		try {
			// Apply a scanning placeholder
			this.applyScanningPlaceholder(element);

			// Extract video data
			const data = this.extractVideoData(element);

			// Skip if missing essential data
			if (!data.title || !data.channelName) {
				logger.warn("YouTubeModule", "Missing essential data", data);
				this.removeScanningPlaceholder(element);
				return;
			}

			// Call the API
			logger.info("YouTubeModule", "Analyzing video", {
				title: data.title,
				channel: data.channelName,
			});
			const response = await this.api.analyzeVideo(
				this.userGoals,
				data.title,
				data.channelName
			);

			// Process the response
			if (response && typeof response.probability === "number") {
				logger.info("YouTubeModule", "Analysis result", {
					title: data.title,
					probability: response.probability,
					cutoff: this.probabilityCutoff,
				});

				if (response.probability > this.probabilityCutoff) {
					// Good video, remove placeholder
					this.removeScanningPlaceholder(element);
				} else {
					// Keep placeholder, effectively hiding it
					this.changePlaceholder(element);
				}
			} else {
				// On failure, show the video anyway
				logger.warn("YouTubeModule", "Invalid API response", response);
				this.changePlaceholder(element, UI_CONFIG.API_ERROR_TEXT);
			}
		} catch (err) {
			logger.error("YouTubeModule", "Error processing element", err);
			this.changePlaceholder(element, UI_CONFIG.ERROR_TEXT);
		}
	}

	/**
	 * Extract video data from a YouTube element
	 * @param {HTMLElement} element - The YouTube element
	 * @returns {Object} - The extracted video data
	 */
	extractVideoData(element) {
		let thumbnailURL = "";
		let videoID = "";
		let title = "";
		let channelName = "";

		// Extract thumbnail
		const img = element.querySelector(youtubeSelectors.thumbnail);
		if (img && img.src) {
			thumbnailURL = img.src;
		}

		// Extract title and video ID
		let titleElement = null;
		for (const selector of youtubeSelectors.title) {
			titleElement = element.querySelector(selector);
			if (titleElement) break;
		}

		if (titleElement) {
			title = titleElement.textContent.trim();
			const href = titleElement.getAttribute("href");
			if (href && href.includes("watch")) {
				const urlParams = new URLSearchParams(href.split("?")[1]);
				videoID = urlParams.get("v") || "";
			}
		}

		// Extract channel name
		let channelElement = null;
		for (const selector of youtubeSelectors.channel) {
			channelElement = element.querySelector(selector);
			if (channelElement) break;
		}

		if (channelElement) {
			channelName = channelElement.textContent.trim().split("\n")[0];
		}

		logger.info("YouTubeModule", "Extracted video data", {
			title,
			channelName,
			videoID,
		});

		return { thumbnailURL, videoID, title, channelName };
	}

	/**
	 * Apply a scanning placeholder to an element
	 * @param {HTMLElement} element - The element to apply the placeholder to
	 */
	applyScanningPlaceholder(element) {
		// Create a placeholder overlay that covers the element
		const placeholder = document.createElement("div");
		placeholder.textContent = UI_CONFIG.PLACEHOLDER_TEXT;
		placeholder.style.position = "absolute";
		placeholder.style.top = "0";
		placeholder.style.left = "0";
		placeholder.style.right = "0";
		placeholder.style.bottom = "0";
		placeholder.style.display = "flex";
		placeholder.style.justifyContent = "center";
		placeholder.style.alignItems = "center";
		placeholder.style.background = "rgba(0,0,0,1)";
		placeholder.style.color = "#fff";
		placeholder.style.zIndex = "9999";
		placeholder.style.fontSize = "18px";
		placeholder.className = "scanning-placeholder";

		// Positioning: Ensure the parent is positioned
		element.style.position = "relative";
		element.appendChild(placeholder);

		logger.info("YouTubeModule", "Applied scanning placeholder", element);
	}

	/**
	 * Remove the scanning placeholder from an element
	 * @param {HTMLElement} element - The element to remove the placeholder from
	 */
	removeScanningPlaceholder(element) {
		const placeholder = element.querySelector(".scanning-placeholder");
		if (placeholder) {
			placeholder.remove();
			logger.info("YouTubeModule", "Removed scanning placeholder", element);
		}
	}

	/**
	 * Change the placeholder text
	 * @param {HTMLElement} element - The element containing the placeholder
	 * @param {string} text - The text to display (optional)
	 */
	changePlaceholder(element, text) {
		const placeholder = element.querySelector(".scanning-placeholder");
		if (placeholder) {
			placeholder.textContent = text || UI_CONFIG.REMOVED_TEXT;
			logger.info("YouTubeModule", "Changed placeholder text", {
				element,
				text,
			});
		}
	}
}
