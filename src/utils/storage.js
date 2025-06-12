/**
 * Storage utility for Chrome extension
 * Provides a wrapper around Chrome's storage API
 */

import { STORAGE_KEYS, DEFAULTS, SITE_DEFAULTS } from "../config/settings.js";

/**
 * Get a value from Chrome storage
 * @param {string} key - The storage key to retrieve
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {Promise<any>} - The stored value or default
 */
export const getValue = (key, defaultValue) => {
	return new Promise((resolve) => {
		chrome.storage.sync.get([key], (result) => {
			resolve(result[key] !== undefined ? result[key] : defaultValue);
		});
	});
};

/**
 * Set a value in Chrome storage
 * @param {string} key - The storage key to set
 * @param {any} value - The value to store
 * @returns {Promise<void>}
 */
export const setValue = (key, value) => {
	return new Promise((resolve) => {
		const data = {};
		data[key] = value;
		chrome.storage.sync.set(data, resolve);
	});
};

/**
 * Get all settings from storage
 * @returns {Promise<Object>} - All settings
 */
export const getAllSettings = async () => {
	return new Promise((resolve) => {
		chrome.storage.sync.get(
			[
				STORAGE_KEYS.GLOBAL_GOALS,
				STORAGE_KEYS.API_KEY,
				STORAGE_KEYS.SITE_PREFERENCES,
				STORAGE_KEYS.SELECTORS,
			],
			(result) => {
				// Get site preferences with defaults
				const storedSitePrefs = result[STORAGE_KEYS.SITE_PREFERENCES] || {};
				const sitePreferences = {};

				// Merge stored preferences with defaults for each site
				Object.keys(SITE_DEFAULTS).forEach((siteId) => {
					sitePreferences[siteId] = {
						...SITE_DEFAULTS[siteId],
						...storedSitePrefs[siteId],
					};
				});

				resolve({
					globalGoals:
						result[STORAGE_KEYS.GLOBAL_GOALS] || DEFAULTS.GLOBAL_GOALS,
					apiKey: result[STORAGE_KEYS.API_KEY] || DEFAULTS.API_KEY,
					sitePreferences,
					customSelectors: result[STORAGE_KEYS.SELECTORS] || null,
				});
			}
		);
	});
};

/**
 * Get settings for a specific site
 * @param {string} siteId - The site identifier
 * @returns {Promise<Object>} - Site-specific settings
 */
export const getSiteSettings = async (siteId) => {
	const allSettings = await getAllSettings();
	const siteSettings =
		allSettings.sitePreferences[siteId] || SITE_DEFAULTS[siteId] || {};

	return {
		globalGoals: allSettings.globalGoals,
		apiKey: allSettings.apiKey,
		...siteSettings,
	};
};

/**
 * Save all settings to storage
 * @param {Object} settings - The settings object
 * @returns {Promise<void>}
 */
export const saveAllSettings = async (settings) => {
	return new Promise((resolve) => {
		const data = {};

		if (settings.globalGoals !== undefined) {
			data[STORAGE_KEYS.GLOBAL_GOALS] = settings.globalGoals;
		}

		if (settings.apiKey !== undefined) {
			data[STORAGE_KEYS.API_KEY] = settings.apiKey;
		}

		if (settings.sitePreferences !== undefined) {
			data[STORAGE_KEYS.SITE_PREFERENCES] = settings.sitePreferences;
		}

		if (settings.customSelectors !== undefined) {
			data[STORAGE_KEYS.SELECTORS] = settings.customSelectors;
		}

		chrome.storage.sync.set(data, resolve);
	});
};

/**
 * Update settings for a specific site
 * @param {string} siteId - The site identifier
 * @param {Object} siteSettings - The site-specific settings
 * @returns {Promise<void>}
 */
export const updateSiteSettings = async (siteId, siteSettings) => {
	const allSettings = await getAllSettings();

	// Update the site preferences
	allSettings.sitePreferences[siteId] = {
		...allSettings.sitePreferences[siteId],
		...siteSettings,
	};

	// Save all settings
	return saveAllSettings(allSettings);
};
