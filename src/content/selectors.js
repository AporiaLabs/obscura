/**
 * DOM selectors configuration
 * Centralizes all selectors used to identify and manipulate elements
 */

// YouTube selectors
export const youtubeSelectors = {
	title: ["#video-title", "a#video-title", ".title a", ".title"],
	channel: ["#channel-name a", ".ytd-channel-name a", "#channel-name"],
	thumbnail: "img",
	contentContainers: [
		"ytd-rich-item-renderer", // Home page and search results video items
		"ytd-compact-video-renderer", // Sidebar recommendations
		"ytp-videowall-still", // End screen recommendations
	],
	removeContainers: [
		"ytp-endscreen-content", // End screen content container
		"ytp-ce-element", // Related video elements at the end
	],
};

// Twitter/X selectors - updated to correctly capture all elements
export const twitterSelectors = {
	// Basic tweet structure
	tweet: 'article[data-testid="tweet"]',

	// User information
	userName: 'div[data-testid="User-Name"] div[dir="ltr"] span span',
	userHandle:
		'div[data-testid="User-Name"] + div a div, div[data-testid="User-Name"] ~ div div[dir="ltr"] span',

	// Tweet content
	tweetText: 'div[data-testid="tweetText"]',

	// Media selectors - improved to catch all formats
	// Images - UPDATED to include Twitter image pattern
	image: 'img[src*="https://pbs.twimg.com/media/"]',

	// Videos
	video: "video",
	videoPlayer: 'div[data-testid="videoPlayer"]',
	videoContainer: 'div[data-testid="videoComponent"]',
	videoThumbnail:
		'div[data-testid="videoPlayer"] img, div[data-testid="videoComponent"] img',
	videoSource: "video source",

	// Interactive elements
	quoteTweet:
		'div.css-175oi2r.r-9aw3ui > div > div > div.css-175oi2r > div[dir="ltr"]',

	// Metrics
	replyCount:
		'[data-testid="reply"] span[data-testid="app-text-transition-container"] span span',
	retweetCount:
		'[data-testid="retweet"] span[data-testid="app-text-transition-container"] span span',
	likeCount:
		'[data-testid="like"] span[data-testid="app-text-transition-container"] span span',
	viewCount:
		'a[aria-label*="views"] span[data-testid="app-text-transition-container"] span span, a[href$="/analytics"] span[data-testid="app-text-transition-container"] span span',

	// Interactive buttons
	bookmarkButton: '[data-testid="bookmark"]',
	shareButton: '[aria-label^="Share post"]',

	// Replies
	repliesContainer: '[data-testid="cellInnerDiv"] > div > div:nth-child(2)',
	replyTweet:
		':scope > div[data-testid="cellInnerDiv"] > div > article[data-testid="tweet"]',
};

// Reddit selectors (placeholder for future implementation)
export const redditSelectors = {
	post: ".Post",
	title: ".PostTitle",
	content: ".PostContent",
	author: ".PostAuthor",
	votes: ".VoteContainer",
	comments: ".CommentContainer",
};

// Legacy YouTube selectors - kept for backward compatibility
export const titleSelectors = "h3.title, yt-formatted-string";
export const videoContainerSelectors =
	"ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer, ytp-videowall-still";

export const contentSelectors = [
	"ytd-rich-item-renderer", // Home page and search results video items
	"ytd-compact-video-renderer", // Sidebar recommendations
	"ytp-videowall-still", // End screen recommendations
];

export const removeSelectors = [
	"ytp-endscreen-content", // End screen content container
	"ytp-ce-element", // Related video elements at the end
];

export const dataSelectors = {
	title: ["#video-title", "a#video-title", ".title a", ".title"],
	channel: ["#channel-name a", ".ytd-channel-name a", "#channel-name"],
	thumbnail: "img",
};
