/**
 * Background script for the Obscura extension
 */

import logger from "./utils/logger.js";
import { STORAGE_KEYS, DEFAULTS, SITE_DEFAULTS } from "./config/settings.js";

// Log when the extension is installed
chrome.runtime.onInstalled.addListener((details) => {
	logger.info("Background", "Obscura extension installed", details.reason);

	// Initialize default settings if needed
	if (details.reason === "install") {
		logger.info("Background", "First install, initializing default settings");

		// Set default settings
		chrome.storage.sync.set(
			{
				[STORAGE_KEYS.GLOBAL_GOALS]: DEFAULTS.GLOBAL_GOALS,
				[STORAGE_KEYS.SITE_PREFERENCES]: SITE_DEFAULTS,
			},
			() => {
				logger.info("Background", "Default settings initialized");
			}
		);

		// Open manifesto page
		chrome.tabs.create({
			url: "https://akrasia.ai/manifesto",
		});
	}
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	logger.info("Background", "Received message", { message, sender });

	// Handle opening the popup
	if (message.action === "openPopup") {
		chrome.action.openPopup();
		sendResponse({ status: "success" });
	}

	return true; // Keep the message channel open for sendResponse
});

// Add context menu item to open manifesto page
chrome.contextMenus.create({
	id: "openManifesto",
	title: "About Obscura",
	contexts: ["action"],
});

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === "openManifesto") {
		chrome.tabs.create({
			url: "https://akrasia.ai/manifesto",
		});
	}
});
