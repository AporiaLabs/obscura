/**
 * Content script for the Obscura extension
 * Runs on supported sites to filter content based on user goals
 */

import logger from "./utils/logger.js";
import { SUPPORTED_SITES } from "./config/settings.js";

// Import site modules
import YouTubeModule from "./sites/youtube/index.js";
import TwitterModule from "./sites/twitter/index.js";
import RedditModule from "./sites/reddit/index.js";

// Active site module
let activeSiteModule = null;

/**
 * Initialize the content script
 */
const initialize = async () => {
	logger.info("ContentScript", "Initializing Obscura content script");

	// Detect current site
	const currentSite = detectCurrentSite();
	if (!currentSite) {
		logger.info("ContentScript", "Not on a supported site");
		return;
	}

	logger.info("ContentScript", `Detected site: ${currentSite.name}`);

	// Initialize the appropriate site module
	try {
		await initializeSiteModule(currentSite.id);
	} catch (error) {
		logger.error("ContentScript", "Site module initialization error", error);
	}
};

/**
 * Detect the current site based on the URL
 * @returns {Object|null} - The detected site or null if not supported
 */
const detectCurrentSite = () => {
	const currentHost = window.location.hostname;

	// Check each supported site
	for (const site of SUPPORTED_SITES) {
		if (
			site.domains.some(
				(domain) => currentHost === domain || currentHost.endsWith(`.${domain}`)
			)
		) {
			return site;
		}
	}

	return null;
};

/**
 * Initialize the appropriate site module
 * @param {string} siteId - The site identifier
 */
const initializeSiteModule = async (siteId) => {
	// Clean up any existing module
	if (activeSiteModule) {
		activeSiteModule.stopObserving();
		activeSiteModule = null;
	}

	// Create and initialize the appropriate module
	switch (siteId) {
		case "youtube":
			activeSiteModule = new YouTubeModule();
			break;
		case "twitter":
			activeSiteModule = new TwitterModule();
			break;
		case "reddit":
			activeSiteModule = new RedditModule();
			break;
		default:
			logger.warn("ContentScript", `No module available for site: ${siteId}`);
			return;
	}

	// Initialize the module
	const initialized = await activeSiteModule.initialize();
	if (initialized) {
		// Start observing
		activeSiteModule.startObserving();
		logger.info("ContentScript", `${siteId} module started successfully`);
	} else {
		logger.warn("ContentScript", `${siteId} module initialization failed`);
		activeSiteModule = null;
	}
};

// Initialize the content script
initialize().catch((error) => {
	logger.error("ContentScript", "Initialization error", error);
});
