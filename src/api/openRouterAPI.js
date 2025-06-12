import OpenAI from "openai";
import { z } from "zod";

const MODEL = "google/gemini-flash-1.5";
const responseSchema = z.object({
	probability: z.number().min(0).max(100),
	// explanation: z.string().min(1),
});

export default class OpenRouterAPI {
	constructor(apiKey) {
		this.apiKey = apiKey;
		this.openai = new OpenAI({
			baseURL: "https://openrouter.ai/api/v1",
			apiKey: apiKey,
			dangerouslyAllowBrowser: true,
		});
	}

	cleanJsonResponse(response) {
		let cleaned = response
			.replace(/```json\n/g, "")
			.replace(/```/g, "")
			.trim();
		cleaned = cleaned.replace(/^\n+/, "");
		if (cleaned.includes("}{")) {
			cleaned = cleaned.split("}{")[0] + "}";
		}
		return cleaned;
	}

	async analyzeVideo(userGoals, videoTitle, channelName) {
		const prompt = `You are analyzing a YouTube video for a user who wants to ${userGoals}.
The video title is "${videoTitle}" and the channel name is "${channelName}".
Estimate the probability (0-100%) that this video will help the user achieve their goals and not waste their time.
Provide a "probability" as a number.

EXAMPLE RESPONSE:
{
    "probability": 85
}`;

		try {
			const completion = await this.openai.chat.completions.create({
				model: MODEL,
				messages: [
					{
						role: "user",
						content: prompt,
					},
				],
				temperature: 1,
				max_tokens: 20,
				response_format: responseSchema,
			});

			const messageContent = completion.choices[0].message.content;
			const cleanedResponse = this.cleanJsonResponse(messageContent);
			console.log(videoTitle, channelName, messageContent);
			const response = JSON.parse(cleanedResponse);
			const validatedResponse = responseSchema.parse(response);
			return validatedResponse;
		} catch (error) {
			console.error("Error analyzing video:", error);
			return null;
		}
	}
	
	async analyzeTweet(userGoals, tweetText, username) {
		const prompt = `You are analyzing a tweet for a user who wants to ${userGoals}.
The tweet text is "${tweetText}" and the username is "${username}".
Estimate the probability (0-100%) that this tweet will help the user achieve their goals and not waste their time.
Provide a "probability" as a number.

EXAMPLE RESPONSE:
{
	"probability": 85
}`;

		try {
			const completion = await this.openai.chat.completions.create({
				model: MODEL,
				messages: [
					{
						role: "user",
						content: prompt,
					},
				],
				temperature: 1,
				max_tokens: 20,
				response_format: responseSchema,
			});

			const messageContent = completion.choices[0].message.content;
			const cleanedResponse = this.cleanJsonResponse(messageContent);
			console.log("Tweet analysis:", username, messageContent);
			const response = JSON.parse(cleanedResponse);
			const validatedResponse = responseSchema.parse(response);
			return validatedResponse;
		} catch (error) {
			console.error("Error analyzing tweet:", error);
			return null;
		}
	}
	
	async analyzeBatchVideos(userGoals, videoBatch) {
		// Create a schema for batch responses
		const batchResponseSchema = z.array(
			z.object({
				id: z.string(),
				probability: z.number().min(0).max(100).optional(),
				error: z.boolean().optional(),
			})
		);
		
		// Format the video info for the prompt
		const videosFormatted = videoBatch.map((video, index) => {
			return `Video ${index + 1}:
- Title: "${video.title}"
- Channel: "${video.channelName}"
- ID: "${video.id}"`;
		}).join("\n\n");
		
		const prompt = `You are analyzing ${videoBatch.length} YouTube videos for a user who wants to ${userGoals}.
For each video, estimate the probability (0-100%) that it will help the user achieve their goals and not waste their time.

Here are the videos:
${videosFormatted}

Provide a JSON array with the analysis results for each video. Include the video ID and probability for each.

EXAMPLE RESPONSE:
[
	{"id": "video1", "probability": 85},
	{"id": "video2", "probability": 30}
]`;

		try {
			const completion = await this.openai.chat.completions.create({
				model: MODEL,
				messages: [
					{
						role: "user",
						content: prompt,
					},
				],
				temperature: 1,
				max_tokens: 500, // Increased for batch responses
			});

			const messageContent = completion.choices[0].message.content;
			const cleanedResponse = this.cleanJsonResponse(messageContent);
			console.log("Batch analysis response:", cleanedResponse);
			
			try {
				const response = JSON.parse(cleanedResponse);
				// Validate the response format
				const validatedResponse = batchResponseSchema.parse(response);
				return validatedResponse;
			} catch (parseError) {
				console.error("Error parsing batch response:", parseError);
				// Create a fallback response with errors for all videos
				return videoBatch.map(video => ({
					id: video.id,
					error: true
				}));
			}
		} catch (error) {
			console.error("Error analyzing batch videos:", error);
			// Return an array of null results to indicate failure
			return videoBatch.map(video => ({
				id: video.id,
				error: true
			}));
		}
	}
	
	async analyzeBatchTweets(userGoals, tweetBatch) {
		// Create a schema for batch responses
		const batchResponseSchema = z.array(
			z.object({
				id: z.string(),
				probability: z.number().min(0).max(100).optional(),
				error: z.boolean().optional(),
			})
		);
		
		// Format the tweet info for the prompt
		const tweetsFormatted = tweetBatch.map((tweet, index) => {
			return `Tweet ${index + 1}:
- Username: "${tweet.username}"
- Content: "${tweet.content}"
- ID: "${tweet.id}"`;
		}).join("\n\n");
		
		const prompt = `You are analyzing ${tweetBatch.length} tweets for a user who wants to ${userGoals}.
For each tweet, estimate the probability (0-100%) that it will help the user achieve their goals and not waste their time.

Here are the tweets:
${tweetsFormatted}

Provide a JSON array with the analysis results for each tweet. Include the tweet ID and probability for each.

EXAMPLE RESPONSE:
[
	{"id": "tweet1", "probability": 85},
	{"id": "tweet2", "probability": 30}
]`;

		try {
			const completion = await this.openai.chat.completions.create({
				model: MODEL,
				messages: [
					{
						role: "user",
						content: prompt,
					},
				],
				temperature: 1,
				max_tokens: 500, // Increased for batch responses
			});

			const messageContent = completion.choices[0].message.content;
			const cleanedResponse = this.cleanJsonResponse(messageContent);
			console.log("Batch tweet analysis response:", cleanedResponse);
			
			try {
				const response = JSON.parse(cleanedResponse);
				// Validate the response format
				const validatedResponse = batchResponseSchema.parse(response);
				return validatedResponse;
			} catch (parseError) {
				console.error("Error parsing batch tweet response:", parseError);
				// Create a fallback response with errors for all tweets
				return tweetBatch.map(tweet => ({
					id: tweet.id,
					error: true
				}));
			}
		} catch (error) {
			console.error("Error analyzing batch tweets:", error);
			// Return an array of null results to indicate failure
			return tweetBatch.map(tweet => ({
				id: tweet.id,
				error: true
			}));
		}
	}
}