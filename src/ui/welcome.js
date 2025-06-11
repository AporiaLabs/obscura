/**
 * Welcome page script
 * Handles interactions on the welcome page
 */

import "./styles.css";
import logger from "../utils/logger.js";

document.addEventListener("DOMContentLoaded", () => {
	logger.info("Welcome", "Welcome page loaded");

	// Handle "Open Settings" button click
	const openSettingsBtn = document.getElementById("open-settings");
	if (openSettingsBtn) {
		openSettingsBtn.addEventListener("click", (e) => {
			e.preventDefault();

			// Open the extension popup
			if (chrome.runtime && chrome.runtime.openOptionsPage) {
				// If the extension has an options page
				chrome.runtime.openOptionsPage();
			} else {
				// Otherwise, open the popup
				chrome.runtime.sendMessage({ action: "openPopup" });
			}
		});
	}

	// Add smooth scrolling for anchor links
	document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
		anchor.addEventListener("click", function (e) {
			e.preventDefault();

			const targetId = this.getAttribute("href").substring(1);
			const targetElement = document.getElementById(targetId);

			if (targetElement) {
				window.scrollTo({
					top: targetElement.offsetTop - 100,
					behavior: "smooth",
				});
			}
		});
	});

	// Add animation classes to sections when they come into view
	const animateOnScroll = () => {
		const sections = document.querySelectorAll("section");

		sections.forEach((section) => {
			const sectionTop = section.getBoundingClientRect().top;
			const windowHeight = window.innerHeight;

			if (sectionTop < windowHeight * 0.75) {
				section.classList.add("animate-fade-in");
			}
		});
	};

	// Initial check for elements in view
	animateOnScroll();

	// Listen for scroll events
	window.addEventListener("scroll", animateOnScroll);
});

// Add a listener for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "welcomePageLoaded") {
		logger.info("Welcome", "Received welcomePageLoaded message");
		sendResponse({ status: "success" });
	}
	return true;
});
