/**
 * Reddit module for Obscura
 * Handles the filtering of Reddit content based on user goals
 */

import BaseSiteModule from "../base.js";
import OpenRouterAPI from "../../api/openRouterAPI.js";
import logger from "../../utils/logger.js";
import { getSiteSettings } from "../../utils/storage.js";

export default class RedditModule extends BaseSiteModule {
	constructor() {
		super("reddit");
		this.observer = null;
		this.api = null;
		this.userGoals = "";
		this.probabilityCutoff = 60;
	}

	/**
	 * Initialize the Reddit module
	 * @returns {Promise<boolean>} - Whether initialization was successful
	 */
	async initialize() {
		// Get site settings
		const settings = await getSiteSettings("reddit");
		if (!settings.enabled) {
			logger.info("RedditModule", "Reddit module is disabled");
			return false;
		}

		if (!settings.apiKey) {
			logger.warn("RedditModule", "No API key found");
			return false;
		}

		// Initialize API
		this.api = new OpenRouterAPI(settings.apiKey);
		this.userGoals = settings.contentPreference || settings.globalGoals;
		this.probabilityCutoff = settings.cutoff || 60;

		logger.info("RedditModule", "Initialized with settings", {
			goalsLength: this.userGoals.length,
			cutoff: this.probabilityCutoff,
		});

		return true;
	}

	/**
	 * Start observing the DOM for Reddit content
	 */
	startObserving() {
		logger.info("RedditModule", "Reddit module under development");

		console.log("Reddit module active - logging content without filtering");
		// This will be implemented in a future version
	}

	/**
	 * Stop observing the DOM
	 */
	stopObserving() {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
			logger.info("RedditModule", "Stopped Reddit observer");
		}
	}
}
