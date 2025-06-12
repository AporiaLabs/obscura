/**
 * Twitter processor module
 * Handles extracting and processing tweet content
 */

import { twitterSelectors } from "./selectors.js";
import logger from "../utils/logger.js";

/**
 * Extract data from a tweet element
 * @param {HTMLElement} tweet - The tweet element
 * @returns {Object} - The extracted tweet data
 */
export const extractTweetData = (tweet) => {
	// Helper function to get text with better error handling and trimming
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
			logger.error("TwitterProcessor", "Error getting text", {
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

	// Engagement metrics - handle potential format changes with fallbacks
	const replyCount = getText(twitterSelectors.replyCount);
	const retweetCount = getText(twitterSelectors.retweetCount);
	const likeCount = getText(twitterSelectors.likeCount);
	const viewCount = getText(twitterSelectors.viewCount);

	// SIMPLIFIED IMAGE DETECTION - Direct check for Twitter image URLs
	const twitterImages = tweet.querySelectorAll(
		'img[src*="https://pbs.twimg.com/media/"]'
	);
	const twitterImageLinks = tweet.querySelectorAll(
		'a[href*="https://pbs.twimg.com/media/"]'
	);

	const hasImage = twitterImages.length > 0 || twitterImageLinks.length > 0;

	let imageSource = "";
	let imageAlt = "";

	// Get image source - prioritize direct image elements
	if (twitterImages.length > 0) {
		imageSource = twitterImages[0].src;
		imageAlt = twitterImages[0].alt || "";
		logger.info(
			"TwitterProcessor",
			"Found Twitter image by src pattern",
			imageSource
		);
	} else if (twitterImageLinks.length > 0) {
		imageSource = twitterImageLinks[0].href;
		logger.info(
			"TwitterProcessor",
			"Found Twitter image by href pattern",
			imageSource
		);
	}

	// Videos
	const videoElement = tweet.querySelector(twitterSelectors.video);
	const hasVideo = !!videoElement;

	let videoSource = "";
	let videoThumbnailSource = "";

	if (hasVideo && videoElement && videoElement.src) {
		videoSource = videoElement.src;
	}

	// Check for quote tweets
	const hasQuoteTweet = !!tweet.querySelector(twitterSelectors.quoteTweet);

	// Construct full tweet data object
	const tweetData = {
		displayName,
		userHandle,
		tweetText,
		replyCount,
		retweetCount,
		likeCount,
		viewCount,
		hasImage,
		hasVideo,
		hasQuoteTweet,
		imageSource,
		imageAlt,
		videoSource,
		videoThumbnailSource,
	};

	// Log successful extraction
	logger.info("TwitterProcessor", "Extracted tweet data", {
		user: userHandle,
		text: tweetText.substring(0, 50) + (tweetText.length > 50 ? "..." : ""),
		hasImage,
		hasVideo,
		imageSource: imageSource ? "Found" : "None",
		videoSource: videoSource ? "Found" : "None",
	});

	return tweetData;
};

/**
 * Process replies to a tweet
 * @param {HTMLElement} tweetElement - The parent tweet element
 * @param {Function} processorCallback - Callback to process each reply
 */
export const processReplies = (tweetElement, processorCallback) => {
	const repliesContainer = tweetElement.querySelector(
		twitterSelectors.repliesContainer
	);

	if (!repliesContainer) {
		return []; // No replies
	}

	const replies = repliesContainer.querySelectorAll(
		twitterSelectors.replyTweet
	);

	if (replies.length > 0) {
		logger.info("TwitterProcessor", `Found ${replies.length} replies to tweet`);
	}

	// Call the callback for each reply
	replies.forEach((reply) => {
		processorCallback(reply);
	});

	return replies;
};

/**
 * Find all tweets on the page
 * @returns {NodeList} - All tweet elements
 */
export const findAllTweets = () => {
	const tweets = document.querySelectorAll(twitterSelectors.tweet);
	logger.info("TwitterProcessor", `Found ${tweets.length} tweets on page`);
	return tweets;
};

export default {
	extractTweetData,
	processReplies,
	findAllTweets,
};
