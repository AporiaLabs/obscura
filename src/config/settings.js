/**
 * Settings management for the extension
 * Centralizes all configuration and default values
 */

// Storage keys
export const STORAGE_KEYS = {
	GLOBAL_GOALS: "globalGoals",
	API_KEY: "openrouterKey",
	SITE_PREFERENCES: "sitePreferences",
	SELECTORS: "customSelectors",
};

// Default values
export const DEFAULTS = {
	GLOBAL_GOALS:
		"A computer science undergrad looking to learn about tech and CS. Show anything that is tech especially AI related and never approve content that is not related to those topics.",
	API_KEY: "",
	MODEL: "google/gemini-flash-1.5",
};

// Site-specific default preferences
export const SITE_DEFAULTS = {
	youtube: {
		enabled: true,
		contentPreference:
			"Show tech tutorials, educational content, and programming videos. Hide entertainment, vlogs, and gaming content.",
		cutoff: 60,
		description:
			"Video sharing platform with a mix of educational and entertainment content.",
	},
	twitter: {
		enabled: true,
		contentPreference:
			"Show tweets showcasing new tech, things people have built, insightful posts of all kinds, and high-effort high-quality content. Hide memes, toxic posts, scams, and tweets that add no value and are obvious.",
		cutoff: 60,
		description:
			"Social media platform with short posts covering a wide range of topics.",
	},
	reddit: {
		enabled: true,
		contentPreference:
			"Show posts about technology, programming, and computer science. Hide political discussions, entertainment content, and off-topic posts.",
		cutoff: 60,
		description:
			"Social news aggregation and discussion website with topic-specific communities.",
		underDevelopment: true,
	},
};

// OpenRouter API configuration
export const API_CONFIG = {
	BASE_URL: "https://openrouter.ai/api/v1",
	MODEL: DEFAULTS.MODEL,
	MAX_TOKENS: 20,
};

// Supported sites configuration
export const SUPPORTED_SITES = [
	{
		id: "youtube",
		name: "YouTube",
		domains: ["youtube.com", "www.youtube.com"],
		icon: "youtube-icon.svg",
	},
	{
		id: "twitter",
		name: "Twitter/X",
		domains: ["twitter.com", "www.twitter.com", "x.com", "www.x.com"],
		icon: "twitter-icon.svg",
	},
	{
		id: "reddit",
		name: "Reddit",
		domains: ["reddit.com", "www.reddit.com", "old.reddit.com"],
		icon: "reddit-icon.svg",
		underDevelopment: true,
	},
];

// UI configuration
export const UI_CONFIG = {
	PLACEHOLDER_TEXT: "Scanning...",
	REMOVED_TEXT: "Brainrot Removed",
	ERROR_TEXT: "Error analyzing content",
	API_ERROR_TEXT: "API Failed",
};
