/**
 * DOM manipulation utilities for YouTube content
 */

import { UI_CONFIG } from "../config/settings.js";
import logger from "../utils/logger.js";

/**
 * Apply a scanning placeholder to an element
 * @param {HTMLElement} element - The element to apply the placeholder to
 */
export const applyScanningPlaceholder = (element) => {
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

	logger.info("DOMHandler", "Applied scanning placeholder", element);
};

/**
 * Remove the scanning placeholder from an element
 * @param {HTMLElement} element - The element to remove the placeholder from
 */
export const removeScanningPlaceholder = (element) => {
	const placeholder = element.querySelector(".scanning-placeholder");
	if (placeholder) {
		placeholder.remove();
		logger.info("DOMHandler", "Removed scanning placeholder", element);
	}
};

/**
 * Change the placeholder text
 * @param {HTMLElement} element - The element containing the placeholder
 * @param {string} text - The text to display (optional)
 */
export const changePlaceholder = (element, text) => {
	const placeholder = element.querySelector(".scanning-placeholder");
	if (placeholder) {
		placeholder.textContent = text || UI_CONFIG.REMOVED_TEXT;
		logger.info("DOMHandler", "Changed placeholder text", { element, text });
	}
};

/**
 * Extract video data from a YouTube element
 * @param {HTMLElement} element - The YouTube element
 * @param {Object} selectors - The selectors to use for extraction
 * @returns {Object} - The extracted video data
 */
export const extractVideoData = (element, selectors) => {
	let thumbnailURL = "";
	let videoID = "";
	let title = "";
	let channelName = "";

	// Extract thumbnail
	const img = element.querySelector(selectors.thumbnail);
	if (img && img.src) {
		thumbnailURL = img.src;
	}

	// Extract title and video ID
	let titleElement = null;
	for (const selector of selectors.title) {
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
	for (const selector of selectors.channel) {
		channelElement = element.querySelector(selector);
		if (channelElement) break;
	}

	if (channelElement) {
		channelName = channelElement.textContent.trim().split("\n")[0];
	}

	logger.info("DOMHandler", "Extracted video data", {
		title,
		channelName,
		videoID,
	});
	return { thumbnailURL, videoID, title, channelName };
};
