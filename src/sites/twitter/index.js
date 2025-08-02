/**
 * Twitter/X module for Obscura
 * Handles the filtering of Twitter/X content based on user goals
 */

import BaseSiteModule from "../base.js";
import OpenRouterAPI from "../../api/openRouterAPI.js";
import logger from "../../utils/logger.js";
import { getSiteSettings } from "../../utils/storage.js";
import { UI_CONFIG } from "../../config/settings.js";
import { twitterSelectors } from "../../content/selectors.js";

export default class TwitterModule extends BaseSiteModule {
	constructor() {
		super("twitter");
		this.observer = null;
		this.api = null;
		this.userGoals = "";
		this.probabilityCutoff = 60;
		this.processedTweets = new Set();
		this.isObserving = false;
	}

	/**
	 * Initialize the Twitter module
	 * @returns {Promise<boolean>} - Whether initialization was successful
	 */
	async initialize() {
		// Get site settings
		const settings = await getSiteSettings("twitter");
		if (!settings.enabled) {
			logger.info("TwitterModule", "Twitter module is disabled");
			return false;
		}

		if (!settings.apiKey) {
			logger.warn("TwitterModule", "No API key found");
			return false;
		}

		// Initialize API
		this.api = new OpenRouterAPI(settings.apiKey);
		this.userGoals = settings.contentPreference || settings.globalGoals;
		this.probabilityCutoff = settings.cutoff || 60;

		logger.info("TwitterModule", "Initialized with settings", {
			goalsLength: this.userGoals.length,
			cutoff: this.probabilityCutoff,
		});

		return true;
	}

	/**
	 * Start observing the DOM for Twitter content
	 */
	startObserving() {
		if (this.isObserving) {
			logger.debug("TwitterModule", "Already observing - skipping");
			return;
		}

		this.isObserving = true;
		logger.info("TwitterModule", "Starting Twitter observer");

		// Process existing content immediately
		this.processExistingContent();

		// Create a MutationObserver to watch for new tweets
		this.observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
					this.processNewContent(mutation.addedNodes);
				}
			}
		});

		// Start observing the main content area
		const mainSection =
			document.querySelector('main[role="main"]') ||
			document.querySelector('div[data-testid="primaryColumn"]') ||
			document.querySelector("#react-root");

		if (mainSection) {
			logger.info("TwitterModule", "Found main content area to observe");
			this.observer.observe(mainSection, {
				childList: true,
				subtree: true,
			});
		} else {
			// If we can't find the main section, observe the body as a fallback
			logger.warn(
				"TwitterModule",
				"Main section not found, observing body instead"
			);
			this.observer.observe(document.body, {
				childList: true,
				subtree: true,
			});
		}
	}

	/**
	 * Stop observing the DOM
	 */
	stopObserving() {
		this.isObserving = false;

		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
			logger.info("TwitterModule", "Stopped Twitter observer");
		}
	}

	/**
	 * Process existing content on the page
	 */
	processExistingContent() {
		const tweets = document.querySelectorAll(twitterSelectors.tweet);

		if (tweets.length === 0) {
			logger.info("TwitterModule", "No existing tweets found");
			return;
		}

		logger.info("TwitterModule", `Found ${tweets.length} existing tweets`);

		// Process each tweet
		tweets.forEach((tweet) => {
			this.processTweet(tweet);
		});
	}

	/**
	 * Process new content added to the DOM
	 * @param {NodeList} addedNodes - The nodes added to the DOM
	 */
	processNewContent(addedNodes) {
		let tweetsFound = 0;

		addedNodes.forEach((node) => {
			if (node.nodeType === Node.ELEMENT_NODE) {
				// Look for tweets within the added node
				const tweets = node.querySelectorAll(twitterSelectors.tweet);
				tweetsFound += tweets.length;

				tweets.forEach((tweet) => {
					setTimeout(() => this.processTweet(tweet), 500); // Add delay to ensure images are loaded
				});

				// Check if the node itself is a tweet
				if (
					node.tagName === "ARTICLE" &&
					node.getAttribute("data-testid") === "tweet"
				) {
					tweetsFound++;
					this.processTweet(node);
				}
			}
		});

		if (tweetsFound > 0) {
			logger.info("TwitterModule", `Found ${tweetsFound} new tweets`);
		}
	}

	/**
	 * Process a single tweet
	 * @param {HTMLElement} tweetElement - The tweet element
	 */
	async processTweet(tweetElement) {
		// Skip if already processed
		if (this.processedTweets.has(tweetElement)) {
			return;
		}

		// Mark as processed
		this.processedTweets.add(tweetElement);

		try {
			// Extract tweet data
			const tweetData = this.extractTweetData(tweetElement);

			// Skip if missing essential data
			if (!tweetData.tweetText && !tweetData.hasImage && !tweetData.hasVideo) {
				logger.warn("TwitterModule", "Tweet missing essential content");
				return;
			}

			logger.info("TwitterModule", "Processing tweet", {
				from: tweetData.userHandle,
				text:
					tweetData.tweetText.substring(0, 50) +
					(tweetData.tweetText.length > 50 ? "..." : ""),
			});

			// Process replies
			this.processReplies(tweetElement);

			// Apply a scanning placeholder
			this.applyScanningPlaceholder(tweetElement);

			// Analyze the tweet
			const response = await this.api.analyzeTweet(
				this.userGoals,
				tweetData.tweetText,
				tweetData.userHandle
			);

			// Process the response
			if (response && typeof response.probability === "number") {
				logger.info("TwitterModule", "Analysis result", {
					from: tweetData.userHandle,
					probability: response.probability,
					cutoff: this.probabilityCutoff,
				});

				if (response.probability > this.probabilityCutoff) {
					// Good tweet, remove placeholder
					this.removeScanningPlaceholder(tweetElement);
				} else {
					// Low quality tweet, hide it
					this.changePlaceholder(tweetElement);
				}
			} else {
				// On failure, show the tweet anyway
				logger.warn("TwitterModule", "Invalid API response", response);
				this.removeScanningPlaceholder(tweetElement);
			}
		} catch (err) {
			logger.error("TwitterModule", "Error processing tweet", err);
			this.removeScanningPlaceholder(tweetElement);
		}
	}

	/**
	 * Process replies to a tweet
	 * @param {HTMLElement} tweetElement - The parent tweet element
	 */
	processReplies(tweetElement) {
		const repliesContainer = tweetElement.querySelector(
			twitterSelectors.repliesContainer
		);
		if (!repliesContainer) {
			return; // No replies
		}

		const replies = repliesContainer.querySelectorAll(
			twitterSelectors.replyTweet
		);

		if (replies.length > 0) {
			logger.info("TwitterModule", `Found ${replies.length} replies to tweet`);
			replies.forEach((reply) => {
				this.processTweet(reply);
			});
		}
	}

	/**
	 * Extract data from a tweet element
	 * @param {HTMLElement} tweet - The tweet element
	 * @returns {Object} - The extracted tweet data
	 */
	extractTweetData(tweet) {
		// Helper function to get text with better error handling
		const getText = (selector, fallbacks = []) => {
			try {
				const element = tweet.querySelector(selector);
				if (element) return element.textContent.trim();

				// Try fallbacks if provided
				for (const fallback of fallbacks) {
					const el = tweet.querySelector(fallback);
					if (el) return el.textContent.trim();
				}
			} catch (err) {
				logger.error("TwitterModule", "Error getting text", {
					selector,
					error: err,
				});
			}
			return "";
		};

		// Basic tweet information
		const displayName = getText(twitterSelectors.userName);
		const userHandle = getText(twitterSelectors.userHandle);
		const tweetText = getText(twitterSelectors.tweetText);

		// Image detection
		const twitterImages = tweet.querySelectorAll(
			'img[src*="https://pbs.twimg.com/media/"]'
		);
		const hasImage = twitterImages.length > 0;

		// Videos
		const videoElement = tweet.querySelector(twitterSelectors.video);
		const videoPlayer = tweet.querySelector(twitterSelectors.videoPlayer);
		const hasVideo = !!videoElement || !!videoPlayer;

		// Check for quote tweets
		const hasQuoteTweet = !!tweet.querySelector(twitterSelectors.quoteTweet);

		// Return the simplified data object
		return {
			displayName,
			userHandle,
			tweetText,
			hasImage,
			hasVideo,
			hasQuoteTweet,
		};
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

		logger.info("TwitterModule", "Applied scanning placeholder");
	}

	/**
	 * Remove the scanning placeholder from an element
	 * @param {HTMLElement} element - The element to remove the placeholder from
	 */
	removeScanningPlaceholder(element) {
		const placeholder = element.querySelector(".scanning-placeholder");
		if (placeholder) {
			placeholder.remove();
			logger.debug("TwitterModule", "Removed scanning placeholder", element);
		}
	}

	/**
	 * Heuristically score tweet sentiment 
	 * @param {string} text - The tweet text content
	 * @returns {number} - sentiment score
	 */
	estimateSentimentScore(text) {
		if (!text || typeof text !== "string") return 0;
		// Simple hash-based score between 0–100
		let hash = 0;
		for (let i = 0; i < text.length; i++) {
			hash = (hash << 5) - hash + text.charCodeAt(i);
			hash |= 0; // Convert to 32bit integer
		}
		return Math.abs(hash % 101); // Score from 0 to 100
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
			logger.debug("TwitterModule", "Changed placeholder text", {
				element,
				text,
			});
		}
	}
}
