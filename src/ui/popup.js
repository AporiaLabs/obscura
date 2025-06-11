/**
 * Popup UI script for the Obscura extension
 */

import "./styles.css";
import {
	getAllSettings,
	saveAllSettings,
	updateSiteSettings,
} from "../utils/storage.js";
import {
	DEFAULTS,
	SITE_DEFAULTS,
	SUPPORTED_SITES,
} from "../config/settings.js";
import logger from "../utils/logger.js";

/**
 * Initialize the popup UI
 */
const initPopup = async () => {
	logger.info("Popup", "Initializing popup UI");

	// Get DOM elements
	const globalGoalsInput = document.getElementById("global-goals");
	const keyInput = document.getElementById("openrouter-key");
	const toggleKeyVisibilityBtn = document.getElementById(
		"toggle-key-visibility"
	);
	const saveBtn = document.getElementById("save-btn");
	const openWelcomeBtn = document.getElementById("open-welcome");

	// Toggle API key visibility
	if (toggleKeyVisibilityBtn && keyInput) {
		toggleKeyVisibilityBtn.addEventListener("click", () => {
			if (keyInput.type === "password") {
				keyInput.type = "text";
				toggleKeyVisibilityBtn.textContent = "🔒";
			} else {
				keyInput.type = "password";
				toggleKeyVisibilityBtn.textContent = "👁️";
			}
		});
	}

	// Tab navigation
	const tabs = {
		global: document.getElementById("tab-global"),
		youtube: document.getElementById("tab-youtube"),
		twitter: document.getElementById("tab-twitter"),
		reddit: document.getElementById("tab-reddit"),
	};

	const tabContents = {
		global: document.getElementById("content-global"),
		youtube: document.getElementById("content-youtube"),
		twitter: document.getElementById("content-twitter"),
		reddit: document.getElementById("content-reddit"),
	};

	// Site-specific elements
	const siteInputs = {};

	SUPPORTED_SITES.forEach((site) => {
		const siteId = site.id;
		siteInputs[siteId] = {
			enabled: document.getElementById(`${siteId}-enabled`),
			content: document.getElementById(`${siteId}-content`),
			cutoff: document.getElementById(`${siteId}-cutoff`),
			cutoffValue: document.getElementById(`${siteId}-cutoff-value`),
		};

		// Add event listeners for cutoff sliders
		if (siteInputs[siteId].cutoff && siteInputs[siteId].cutoffValue) {
			siteInputs[siteId].cutoff.addEventListener("input", () => {
				siteInputs[siteId].cutoffValue.textContent =
					siteInputs[siteId].cutoff.value;
			});
		}

		// Add event listeners for toggle switches
		if (siteInputs[siteId].enabled) {
			siteInputs[siteId].enabled.addEventListener("change", () => {
				const isChecked = siteInputs[siteId].enabled.checked;
				if (siteInputs[siteId].enabled.parentElement) {
					const toggleDiv =
						siteInputs[siteId].enabled.parentElement.querySelector("div");
					if (toggleDiv) {
						if (isChecked) {
							toggleDiv.classList.add("bg-primary-600");
							toggleDiv.querySelector("div").classList.add("translate-x-5");
						} else {
							toggleDiv.classList.remove("bg-primary-600");
							toggleDiv.querySelector("div").classList.remove("translate-x-5");
						}
					}
				}
			});
		}
	});

	// Tab switching
	Object.keys(tabs).forEach((tabId) => {
		if (tabs[tabId]) {
			tabs[tabId].addEventListener("click", () => {
				// Hide all tab contents
				Object.values(tabContents).forEach((content) => {
					if (content) content.classList.add("hidden");
				});

				// Show selected tab content
				if (tabContents[tabId]) {
					tabContents[tabId].classList.remove("hidden");
				}

				// Update tab styles
				Object.values(tabs).forEach((tab) => {
					if (tab) {
						tab.classList.remove("border-primary-500", "text-primary-400");
						tab.classList.add("border-transparent");
					}
				});

				tabs[tabId].classList.add("border-primary-500", "text-primary-400");
				tabs[tabId].classList.remove("border-transparent");
			});
		}
	});

	// Load existing settings
	const settings = await getAllSettings();
	logger.info("Popup", "Loaded settings", settings);

	// Populate global settings
	if (settings.globalGoals && globalGoalsInput) {
		globalGoalsInput.value = settings.globalGoals;
	}

	if (settings.apiKey && keyInput) {
		keyInput.value = settings.apiKey;
	}

	// Populate site-specific settings
	SUPPORTED_SITES.forEach((site) => {
		const siteId = site.id;
		const siteSettings = settings.sitePreferences[siteId];

		if (siteSettings && siteInputs[siteId]) {
			// Set enabled state
			if (siteInputs[siteId].enabled) {
				siteInputs[siteId].enabled.checked = siteSettings.enabled;
				// Update toggle appearance
				if (siteSettings.enabled) {
					const toggleDiv =
						siteInputs[siteId].enabled.parentElement.querySelector("div");
					if (toggleDiv) {
						toggleDiv.classList.add("bg-primary-600");
						toggleDiv.querySelector("div").classList.add("translate-x-5");
					}
				}
			}

			// Set content preference
			if (siteInputs[siteId].content && siteSettings.contentPreference) {
				siteInputs[siteId].content.value = siteSettings.contentPreference;
			}

			// Set cutoff value
			if (
				siteInputs[siteId].cutoff &&
				typeof siteSettings.cutoff === "number"
			) {
				siteInputs[siteId].cutoff.value = siteSettings.cutoff;
				if (siteInputs[siteId].cutoffValue) {
					siteInputs[siteId].cutoffValue.textContent = siteSettings.cutoff;
				}
			}
		}
	});

	// Open manifesto page
	if (openWelcomeBtn) {
		openWelcomeBtn.addEventListener("click", () => {
			chrome.tabs.create({ url: "https://akrasia.ai/manifesto" });
		});
	}

	// Save settings
	if (saveBtn) {
		saveBtn.addEventListener("click", async () => {
			const key = keyInput ? keyInput.value.trim() : "";
			const globalGoals = globalGoalsInput
				? globalGoalsInput.value.trim()
				: DEFAULTS.GLOBAL_GOALS;

			if (!key) {
				alert("Please enter a valid OpenRouter key.");
				return;
			}

			// Show loading state
			saveBtn.classList.add("btn-loading");
			saveBtn.disabled = true;

			try {
				// Verify API key
				const keyValid = await verifyKey(key);
				if (!keyValid) {
					alert("Invalid OpenRouter key. Please check and try again.");
					return;
				}

				// Collect site preferences
				const sitePreferences = {};

				SUPPORTED_SITES.forEach((site) => {
					const siteId = site.id;
					if (siteInputs[siteId]) {
						sitePreferences[siteId] = {
							enabled: siteInputs[siteId].enabled
								? siteInputs[siteId].enabled.checked
								: true,
							contentPreference: siteInputs[siteId].content
								? siteInputs[siteId].content.value.trim()
								: SITE_DEFAULTS[siteId].contentPreference,
							cutoff: siteInputs[siteId].cutoff
								? parseInt(siteInputs[siteId].cutoff.value, 10)
								: SITE_DEFAULTS[siteId].cutoff,
							underDevelopment: SITE_DEFAULTS[siteId].underDevelopment || false,
						};
					}
				});

				// Save all settings
				await saveAllSettings({
					apiKey: key,
					globalGoals,
					sitePreferences,
				});

				// Simulate a minimum loading time of 1 second
				await new Promise((resolve) => setTimeout(resolve, 1000));

				alert("Settings saved!");
				logger.info("Popup", "Settings saved", {
					globalGoalsLength: globalGoals.length,
					sites: Object.keys(sitePreferences),
				});
			} catch (error) {
				logger.error("Popup", "Error saving settings", error);
				alert("Error saving settings. Please try again.");
			} finally {
				// Remove loading state
				saveBtn.classList.remove("btn-loading");
				saveBtn.disabled = false;
			}
		});
	}
};

/**
 * Verify an OpenRouter API key
 * @param {string} key - The API key to verify
 * @returns {Promise<boolean>} - Whether the key is valid
 */
const verifyKey = async (key) => {
	try {
		const resp = await fetch("https://openrouter.ai/api/v1/models", {
			headers: {
				Authorization: `Bearer ${key}`,
			},
		});

		if (!resp.ok) {
			logger.warn("Popup", "API key verification failed", resp.status);
			return false;
		}

		return true;
	} catch (err) {
		logger.error("Popup", "API key verification error", err);
		return false;
	}
};

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initPopup);
