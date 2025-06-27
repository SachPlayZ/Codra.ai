import axios from "axios";
import * as cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";

class ScraperService {
  constructor() {
    this.userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    ];

    // Platform-specific selectors for popular hackathon platforms
    this.platformSelectors = {
      devpost: {
        title: ".challenge-title, .software-challenge-title, h1",
        tracks: ".challenge-tracks li, .prizes li",
        prizes: ".prize-amount, .prize-value",
        dates: ".submission-period, .challenge-timeline",
      },
      mlh: {
        title: ".event-title, h1",
        tracks: ".tracks li, .categories li",
        prizes: ".prizes li, .prize-amount",
        dates: ".event-date, .timeline",
      },
      hackathon: {
        title: ".hackathon-title, .event-title, h1",
        tracks: ".tracks li, .categories li",
        prizes: ".prizes li, .prize-amount",
        dates: ".event-date, .timeline",
      },
    };

    // Initialize Google AI
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  async scrapeHackathon(url) {
    try {
      console.log("Starting hackathon scraping for URL:", url);

      // Detect platform and clean URL
      const platform = this.detectPlatform(url);
      const cleanUrl = this.cleanUrl(url, platform);

      console.log("Detected platform:", platform);
      console.log("Clean URL:", cleanUrl);

      // Scrape content based on platform
      let scrapedContent = "";
      let iconUrl = "";

      if (platform === "devfolio") {
        // Scrape main page
        console.log("Scraping Devfolio main page:", cleanUrl);
        const { content: mainPageContent, icon: mainIcon } =
          await this.scrapePage(cleanUrl, true);
        iconUrl = mainIcon;
        console.log("Main page content length:", mainPageContent.length);

        // Scrape prizes page - ensure no double slashes
        const baseUrl = cleanUrl.endsWith("/")
          ? cleanUrl.slice(0, -1)
          : cleanUrl;
        const prizesUrl = `${baseUrl}/prizes`;
        console.log("Scraping Devfolio prizes page:", prizesUrl);
        const { content: prizesPageContent } = await this.scrapePage(
          prizesUrl,
          false
        );
        console.log("Prizes page content length:", prizesPageContent.length);

        // Scrape schedule page for timezone information
        const scheduleUrl = `${baseUrl}/schedule`;
        console.log("Scraping Devfolio schedule page:", scheduleUrl);
        const { content: schedulePageContent } = await this.scrapePage(
          scheduleUrl,
          false
        );
        console.log(
          "Schedule page content length:",
          schedulePageContent.length
        );

        if (prizesPageContent && prizesPageContent.length > 100) {
          scrapedContent = `MAIN PAGE:\n${mainPageContent}\n\nPRIZES PAGE:\n${prizesPageContent}`;
        } else {
          console.log(
            "Prizes page returned minimal content, using main page only"
          );
          scrapedContent = mainPageContent;
        }

        // Add schedule content if available
        if (schedulePageContent && schedulePageContent.length > 100) {
          scrapedContent += `\n\nSCHEDULE PAGE:\n${schedulePageContent}`;
          console.log("Added schedule page content for timezone extraction");
        } else {
          console.log("Schedule page returned minimal content");
        }

        // Log a sample of the content for debugging
        console.log(
          "Sample of combined content:",
          scrapedContent.substring(0, 500)
        );
      } else {
        // For other platforms, just scrape the main page
        const { content, icon } = await this.scrapePage(cleanUrl, true);
        scrapedContent = content;
        iconUrl = icon;
      }

      console.log("Scraped content length:", scrapedContent.length);
      console.log("Icon URL:", iconUrl);

      // Use LLM to analyze and extract structured data
      const extractedData = await this.analyzeWithLLM(
        scrapedContent,
        url,
        platform
      );

      // Add icon URL
      extractedData.icon = iconUrl;

      // Convert IANA timezone to UTC offset if possible for better accuracy
      if (extractedData.timezone && extractedData.timezone.includes("/")) {
        try {
          const utcOffset = this.getUTCOffsetFromIANA(extractedData.timezone);
          if (utcOffset) {
            console.log(
              `Converting IANA timezone ${extractedData.timezone} to UTC offset: ${utcOffset}`
            );
            extractedData.timezone = utcOffset;
          }
        } catch (e) {
          console.log(
            `Could not convert IANA timezone ${extractedData.timezone} to UTC offset:`,
            e.message
          );
        }
      }

      console.log(`\n=== LLM EXTRACTION DEBUG ===`);
      console.log(`LLM Extracted Timezone: "${extractedData.timezone}"`);
      console.log(`LLM Extracted Start Date: "${extractedData.startDate}"`);
      console.log(`LLM Extracted End Date: "${extractedData.endDate}"`);
      console.log(`=== END LLM DEBUG ===\n`);

      // Parse end date to create endDateTime for countdown using extracted timezone
      if (extractedData.endDate && extractedData.endDate !== "TBD") {
        try {
          let utcDate;
          if (extractedData.timezone) {
            // Use the extracted timezone for conversion
            utcDate = this.convertToUTC(
              extractedData.endDate,
              extractedData.timezone
            );
          } else {
            // Fallback to New York timezone if no timezone was extracted
            console.log(
              "No timezone extracted, falling back to New York timezone"
            );
            utcDate = this.convertNYToUTC(extractedData.endDate);
          }
          extractedData.endDateTime = utcDate.toISOString();
          console.log(
            `Final Result: ${extractedData.endDate} (${
              extractedData.timezone || "NY fallback"
            }) converted to UTC: ${utcDate.toISOString()}`
          );
        } catch (e) {
          console.log(
            "Could not parse end date:",
            extractedData.endDate,
            "Error:",
            e.message
          );
        }
      }

      console.log("LLM extracted data:", extractedData);

      return extractedData;
    } catch (error) {
      console.error("Scraping error:", error);
      throw new Error(`Failed to scrape hackathon: ${error.message}`);
    }
  }

  detectPlatform(url) {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes("devfolio.co")) return "devfolio";
    if (hostname.includes("devpost.com")) return "devpost";
    if (hostname.includes("mlh.io")) return "mlh";
    if (hostname.includes("hackathon.com")) return "hackathon";

    return "generic";
  }

  cleanUrl(url, platform) {
    const urlObj = new URL(url);

    if (platform === "devfolio") {
      // For Devfolio, keep the full path but ensure it ends properly
      let pathname = urlObj.pathname;

      // Remove trailing slash from pathname if present
      if (pathname.endsWith("/") && pathname.length > 1) {
        pathname = pathname.slice(0, -1);
      }

      // Construct clean URL
      const cleanedUrl = `${urlObj.protocol}//${urlObj.hostname}${pathname}`;

      console.log("Cleaned Devfolio URL:", cleanedUrl);
      return cleanedUrl;
    } else {
      // For other platforms, remove everything after the domain
      return `${urlObj.protocol}//${urlObj.hostname}`;
    }
  }

  async scrapePage(url, extractIcon = false) {
    const userAgent =
      this.userAgents[Math.floor(Math.random() * this.userAgents.length)];

    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          "User-Agent": userAgent,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Cache-Control": "no-cache",
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 400,
      });

      const $ = cheerio.load(response.data);

      let iconUrl = "";

      if (extractIcon) {
        // Try to find hackathon icon/logo
        const iconSelectors = [
          'img[class*="logo"]',
          'img[class*="icon"]',
          'img[class*="brand"]',
          'img[alt*="logo"]',
          'img[alt*="icon"]',
          ".logo img",
          ".icon img",
          "header img",
          "nav img",
        ];

        for (const selector of iconSelectors) {
          const iconElement = $(selector).first();
          if (iconElement.length > 0) {
            iconUrl = iconElement.attr("src") || "";
            if (iconUrl && !iconUrl.startsWith("http")) {
              // Make URL absolute
              const baseUrl = new URL(url);
              iconUrl = new URL(iconUrl, baseUrl).href;
            }
            break;
          }
        }
      }

      // Remove script and style elements
      $("script, style, noscript").remove();

      // Extract text content
      const textContent = $("body").text().replace(/\s+/g, " ").trim();

      return { content: textContent, icon: iconUrl };
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error.message);
      return { content: "", icon: "" };
    }
  }

  async analyzeWithLLM(content, originalUrl, platform) {
    const prompt = `
You are an expert at analyzing hackathon websites and extracting structured information. 

Please analyze the following scraped content from a hackathon website and extract the key information into a JSON object.

Original URL: ${originalUrl}
Platform: ${platform}

Scraped Content:
${content.substring(0, 15000)} // Truncated for brevity

${
  platform === "devfolio"
    ? `
IMPORTANT: This content includes MAIN PAGE, PRIZES PAGE, and SCHEDULE PAGE from Devfolio. 
- The PRIZES PAGE section contains detailed sponsor track information with specific challenge categories and prize breakdowns.
- The SCHEDULE PAGE section contains timezone information and event timing details.
Pay special attention to both sections for extracting sponsor tracks, subtracks, and timezone information.
`
    : ""
}

Please extract and return ONLY a valid JSON object with the following structure:

{
  "title": "Hackathon Name",
  "startDate": "YYYY-MM-DD or date string",
  "endDate": "YYYY-MM-DD or date string",
  "timezone": "Timezone (e.g., EST, PST, IST, UTC+5:30, America/New_York)",
  "totalPrizePool": "Total prize pool amount (e.g., $239,500)",
  "tracks": [
    {
      "name": "Company/Sponsor Name (e.g., ElizaOS)",
      "totalPrize": "Total prize pool for this sponsor",
      "subTracks": [
        {
          "name": "Track name (e.g., DeFi & Web3 Agents)",
          "description": "Detailed description of what they're looking for",
          "prizes": {
            "first": "1st place prize amount",
            "second": "2nd place prize amount",
            "third": "3rd place prize amount"
          }
        }
      ]
    }
  ],
  "prizes": [
    {
      "amount": "Main Prize Amount",
      "description": "Main Prize Description"
    }
  ],
  "rules": [
    "Rule 1",
    "Rule 2"
  ],
  "link": "${originalUrl}"
}

Important guidelines:
- Extract the TOTAL PRIZE POOL prominently displayed on the page (e.g., "$239,500" from main header/banner)
- Extract TIMEZONE information from the schedule page - PREFER UTC OFFSETS (UTC+5:30, GMT-8, +05:30) over timezone names when possible
- Look for phrases like "All times are in EST", "Schedule (IST)", "Times shown in PST", "UTC-8", "GMT+5:30", etc.
- If only timezone names are available (EST, PST, IST), extract those, but UTC offsets are preferred for accuracy
- For Devfolio hackathons, look carefully at the PRIZES PAGE section for detailed sponsor information
- Each track should represent a COMPANY/SPONSOR (e.g., ElizaOS, AWS, Google, etc.)
- Each sponsor track should have multiple subTracks which are the actual challenge categories
- Each subTrack MUST have its own specific description and prize breakdown (1st, 2nd, 3rd place amounts)
- Look for phrases like "DeFi & Web3 Agents", "Productivity & operations", "Multi-agent & orchestration" as subtrack names
- Extract ALL available sponsor tracks and their subtracks - don't limit to just a few
- If dates are not found, use "TBD" or "To be announced"
- If timezone is not found, leave it as empty string ""
- Main hackathon prizes (not sponsor-specific) should go in the "prizes" array
- Ensure all dates are in a readable format
- Extract only factual information, do not make assumptions
- Return ONLY the JSON object, no additional text
- The totalPrizePool should be the overall prize amount shown on the main page

JSON Response:`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in LLM response");
      }

      const extractedData = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!extractedData.title) {
        extractedData.title = "Untitled Hackathon";
      }
      if (!extractedData.startDate) {
        extractedData.startDate = "TBD";
      }
      if (!extractedData.endDate) {
        extractedData.endDate = "TBD";
      }
      if (!extractedData.tracks) {
        extractedData.tracks = [];
      }
      if (!extractedData.prizes) {
        extractedData.prizes = [];
      }
      if (!extractedData.rules) {
        extractedData.rules = [];
      }
      if (!extractedData.link) {
        extractedData.link = originalUrl;
      }

      return extractedData;
    } catch (error) {
      console.error("LLM analysis error:", error);

      // Fallback to basic extraction
      return {
        title: "Hackathon from " + new URL(originalUrl).hostname,
        startDate: "TBD",
        endDate: "TBD",
        tracks: [],
        prizes: [],
        rules: [],
        link: originalUrl,
      };
    }
  }

  extractTitle($, platform = "generic") {
    // Try platform-specific selectors first
    if (platform !== "generic" && this.platformSelectors[platform]) {
      const platformSelectors =
        this.platformSelectors[platform].title.split(", ");
      for (const selector of platformSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          const title = element.text().trim();
          if (title && title.length > 0 && title.length < 200) {
            return this.cleanTitle(title);
          }
        }
      }
    }

    // Fallback to generic selectors
    const titleSelectors = [
      "h1",
      ".title",
      ".hackathon-title",
      ".event-title",
      ".challenge-title",
      "[class*='title']",
      "title",
    ];

    for (const selector of titleSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const title = element.text().trim();
        if (title && title.length > 0 && title.length < 200) {
          return this.cleanTitle(title);
        }
      }
    }

    // Fallback to page title
    const pageTitle = $("title").text().trim();
    if (pageTitle) {
      return this.cleanTitle(pageTitle);
    }

    return "Untitled Hackathon";
  }

  cleanTitle(title) {
    return title
      .replace(/[-|–] Hackathon|Hackathon[-|–]/gi, "")
      .replace(/[-|–] Challenge|Challenge[-|–]/gi, "")
      .replace(/[-|–] Event|Event[-|–]/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  extractStartDate($, platform = "generic") {
    const datePatterns = [
      /(\d{4}-\d{2}-\d{2})/g,
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,
      /(\d{1,2}-\d{1,2}-\d{4})/g,
      /(\w+ \d{1,2},? \d{4})/g,
    ];

    const text = $("body").text();
    const dates = [];

    // Extract all dates from text
    datePatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        dates.push(...matches);
      }
    });

    // Look for specific date-related elements
    const dateSelectors = [
      "[class*='date']",
      "[class*='start']",
      "[class*='end']",
      ".event-date",
      ".hackathon-date",
      ".submission-period",
      ".timeline",
    ];

    dateSelectors.forEach((selector) => {
      const element = $(selector);
      if (element.length > 0) {
        const dateText = element.text();
        datePatterns.forEach((pattern) => {
          const matches = dateText.match(pattern);
          if (matches) {
            dates.push(...matches);
          }
        });
      }
    });

    // Return the first valid date or TBD
    return dates.length > 0 ? dates[0] : "TBD";
  }

  extractEndDate($, platform = "generic") {
    const datePatterns = [
      /(\d{4}-\d{2}-\d{2})/g,
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,
      /(\d{1,2}-\d{1,2}-\d{4})/g,
      /(\w+ \d{1,2},? \d{4})/g,
    ];

    const text = $("body").text();
    const dates = [];

    datePatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        dates.push(...matches);
      }
    });

    // Return the second date if available, otherwise TBD
    return dates.length > 1 ? dates[1] : "TBD";
  }

  extractTracks($, platform = "generic") {
    const tracks = [];

    // Try platform-specific selectors first
    if (platform !== "generic" && this.platformSelectors[platform]) {
      const platformSelectors =
        this.platformSelectors[platform].tracks.split(", ");
      for (const selector of platformSelectors) {
        $(selector).each((index, element) => {
          const trackText = $(element).text().trim();
          if (trackText && trackText.length > 0 && trackText.length < 100) {
            if (this.isValidTrackName(trackText)) {
              tracks.push({
                name: trackText,
                description: "",
              });
            }
          }
        });
      }
    }

    // Common selectors for tracks/categories
    const trackSelectors = [
      "[class*='track']",
      "[class*='category']",
      "[class*='theme']",
      ".tracks li",
      ".categories li",
      ".themes li",
      "[class*='challenge']",
    ];

    trackSelectors.forEach((selector) => {
      $(selector).each((index, element) => {
        const trackText = $(element).text().trim();
        if (trackText && trackText.length > 0 && trackText.length < 100) {
          if (this.isValidTrackName(trackText)) {
            tracks.push({
              name: trackText,
              description: "",
            });
          }
        }
      });
    });

    // Look for track names in headings
    $("h2, h3, h4").each((index, element) => {
      const headingText = $(element).text().trim();
      if (this.isValidTrackName(headingText)) {
        const description = $(element).next("p").text().trim() || "";
        tracks.push({
          name: headingText,
          description: description,
        });
      }
    });

    // Remove duplicates and limit
    const uniqueTracks = tracks.filter(
      (track, index, self) =>
        index ===
        self.findIndex((t) => t.name.toLowerCase() === track.name.toLowerCase())
    );

    return uniqueTracks.slice(0, 10);
  }

  extractPrizes($, platform = "generic") {
    const prizes = [];

    // Try platform-specific selectors first
    if (platform !== "generic" && this.platformSelectors[platform]) {
      const platformSelectors =
        this.platformSelectors[platform].prizes.split(", ");
      for (const selector of platformSelectors) {
        $(selector).each((index, element) => {
          const prizeText = $(element).text().trim();
          if (prizeText && prizeText.length > 0) {
            const amountMatch = prizeText.match(
              /\$[\d,]+|[\d,]+\s*(?:USD|dollars|dollar)/i
            );
            if (amountMatch) {
              prizes.push({
                amount: amountMatch[0],
                description:
                  prizeText.replace(amountMatch[0], "").trim() || "Prize",
              });
            }
          }
        });
      }
    }

    // Look for prize amounts
    const prizePatterns = [
      /\$[\d,]+/g,
      /[\d,]+\s*(?:USD|dollars|dollar)/gi,
      /[\d,]+\s*(?:euros?|€)/gi,
      /[\d,]+\s*(?:pounds?|£)/gi,
    ];

    const text = $("body").text();

    prizePatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          prizes.push({
            amount: match,
            description: "Prize",
          });
        });
      }
    });

    // Look for prize-related elements
    const prizeSelectors = [
      "[class*='prize']",
      "[class*='reward']",
      ".prizes li",
      ".rewards li",
    ];

    prizeSelectors.forEach((selector) => {
      $(selector).each((index, element) => {
        const prizeText = $(element).text().trim();
        if (prizeText && prizeText.length > 0) {
          const amountMatch = prizeText.match(
            /\$[\d,]+|[\d,]+\s*(?:USD|dollars|dollar)/i
          );
          if (amountMatch) {
            prizes.push({
              amount: amountMatch[0],
              description:
                prizeText.replace(amountMatch[0], "").trim() || "Prize",
            });
          }
        }
      });
    });

    // Remove duplicates and limit
    const uniquePrizes = prizes.filter(
      (prize, index, self) =>
        index === self.findIndex((p) => p.amount === prize.amount)
    );

    return uniquePrizes.slice(0, 5);
  }

  extractRules($, platform = "generic") {
    const rules = [];

    // Common selectors for rules
    const ruleSelectors = [
      "[class*='rule']",
      "[class*='guideline']",
      "[class*='requirement']",
      ".rules li",
      ".guidelines li",
      ".requirements li",
    ];

    ruleSelectors.forEach((selector) => {
      $(selector).each((index, element) => {
        const ruleText = $(element).text().trim();
        if (ruleText && ruleText.length > 0 && ruleText.length < 500) {
          rules.push(ruleText);
        }
      });
    });

    // Look for rules in paragraphs
    $("p").each((index, element) => {
      const paragraphText = $(element).text().trim();
      if (
        paragraphText.includes("rule") ||
        paragraphText.includes("guideline")
      ) {
        if (paragraphText.length > 0 && paragraphText.length < 500) {
          rules.push(paragraphText);
        }
      }
    });

    // Remove duplicates and limit
    const uniqueRules = rules.filter(
      (rule, index, self) =>
        index === self.findIndex((r) => r.toLowerCase() === rule.toLowerCase())
    );

    return uniqueRules.slice(0, 10);
  }

  isValidTrackName(text) {
    // Check if text looks like a track name
    const trackKeywords = [
      "ai",
      "ml",
      "machine learning",
      "artificial intelligence",
      "web",
      "mobile",
      "app",
      "application",
      "blockchain",
      "crypto",
      "web3",
      "defi",
      "health",
      "medical",
      "fitness",
      "wellness",
      "education",
      "learning",
      "edtech",
      "environment",
      "climate",
      "sustainability",
      "social",
      "community",
      "impact",
      "gaming",
      "game",
      "entertainment",
      "finance",
      "fintech",
      "banking",
      "security",
      "cybersecurity",
      "privacy",
      "iot",
      "hardware",
      "robotics",
      "data",
      "analytics",
      "visualization",
      "innovation",
      "creativity",
      "design",
      "accessibility",
      "inclusion",
      "diversity",
    ];

    const lowerText = text.toLowerCase();
    return (
      trackKeywords.some((keyword) => lowerText.includes(keyword)) ||
      (text.length > 3 && text.length < 50 && !text.includes("http"))
    );
  }

  // Helper function to convert New York time to UTC
  convertNYToUTC(dateString) {
    // Parse the date string and assume it's in New York timezone
    const date = new Date(dateString);

    // Define DST rules for 2024-2026
    const year = date.getFullYear();

    // DST starts on the second Sunday in March
    const dstStart = this.getNthSundayOfMonth(year, 2, 2); // March is month 2 (0-indexed)
    dstStart.setHours(2, 0, 0, 0); // 2:00 AM

    // DST ends on the first Sunday in November
    const dstEnd = this.getNthSundayOfMonth(year, 10, 1); // November is month 10 (0-indexed)
    dstEnd.setHours(2, 0, 0, 0); // 2:00 AM

    // Determine if the date is during DST
    const isDST = date >= dstStart && date < dstEnd;

    // New York is UTC-5 (EST) or UTC-4 (EDT during DST)
    const offsetHours = isDST ? 4 : 5;

    // Convert to UTC by adding the offset
    const utcDate = new Date(date.getTime() + offsetHours * 60 * 60 * 1000);

    return utcDate;
  }

  convertToUTC(dateString, timezone) {
    console.log(`\n=== SIMPLE TIMEZONE CONVERSION ===`);
    console.log(`SCRAPED TIME: "${dateString}"`);
    console.log(`SCRAPED TIMEZONE: ${timezone}`);

    // Parse the date string and assume end of day if no time specified
    let baseTime;
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/) || !dateString.includes(":")) {
      // Parse date and set to 11:59 PM
      const dateOnlyMatch = dateString.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/);
      if (dateOnlyMatch) {
        const [, monthName, dayStr, yearStr] = dateOnlyMatch;
        const monthMap = {
          january: 0,
          february: 1,
          march: 2,
          april: 3,
          may: 4,
          june: 5,
          july: 6,
          august: 7,
          september: 8,
          october: 9,
          november: 10,
          december: 11,
        };
        const year = parseInt(yearStr);
        const month = monthMap[monthName.toLowerCase()];
        const day = parseInt(dayStr);

        // Create date at end of day in UTC (as neutral reference point)
        baseTime = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
        console.log(`PARSED AS: ${monthName} ${day}, ${year} 11:59 PM`);
      } else {
        baseTime = new Date(dateString);
        baseTime.setUTCHours(23, 59, 59, 999);
        console.log(`FALLBACK PARSED AS: ${dateString} 11:59 PM`);
      }
    } else {
      baseTime = new Date(dateString);
      console.log(`PARSED WITH TIME: ${dateString}`);
    }

    console.log(`BASE TIME (UTC): ${baseTime.toISOString()}`);

    // Parse timezone offset
    let offsetHours = 0;
    const utcOffsetMatch = timezone.match(
      /(?:utc|gmt)\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?/i
    );
    if (utcOffsetMatch) {
      const sign = utcOffsetMatch[1] === "+" ? 1 : -1;
      const hours = parseInt(utcOffsetMatch[2]);
      const minutes = utcOffsetMatch[3] ? parseInt(utcOffsetMatch[3]) : 0;
      offsetHours = sign * (hours + minutes / 60);
      console.log(`TIMEZONE OFFSET: ${offsetHours} hours`);
    }

    // Apply offset: if timezone is UTC-7, subtract 7 hours from the base time to get UTC
    // if timezone is UTC+5:30, add 5.5 hours to the base time to get UTC
    const utcTime = new Date(baseTime.getTime() - offsetHours * 60 * 60 * 1000);

    console.log(
      `CALCULATION: ${baseTime.toISOString()} ${
        offsetHours >= 0 ? "-" : "+"
      } ${Math.abs(offsetHours)} hours`
    );
    console.log(`RESULT UTC TIME: ${utcTime.toISOString()}`);
    console.log(`=== END CONVERSION ===\n`);

    return utcTime;
  }

  getNthSundayOfMonth(year, month, n) {
    const firstDay = new Date(year, month, 1);
    const firstSunday = new Date(firstDay);
    firstSunday.setDate(1 + ((7 - firstDay.getDay()) % 7));

    const nthSunday = new Date(firstSunday);
    nthSunday.setDate(firstSunday.getDate() + (n - 1) * 7);

    return nthSunday;
  }

  getUTCOffsetFromIANA(timezone) {
    try {
      // Use current date to get the timezone offset (handles DST automatically)
      const now = new Date();

      // Use Intl.DateTimeFormat to get the timezone offset
      const formatter = new Intl.DateTimeFormat("en", {
        timeZone: timezone,
        timeZoneName: "longOffset",
      });

      const parts = formatter.formatToParts(now);
      const offsetPart = parts.find((part) => part.type === "timeZoneName");

      if (offsetPart && offsetPart.value) {
        // Parse offset like "GMT-8" or "GMT+5:30"
        const offsetMatch = offsetPart.value.match(
          /GMT([+-])(\d{1,2})(?::?(\d{2}))?/
        );
        if (offsetMatch) {
          const sign = offsetMatch[1];
          const hours = offsetMatch[2].padStart(2, "0");
          const minutes = offsetMatch[3] || "00";
          return `UTC${sign}${hours}:${minutes}`;
        }
      }

      // Fallback method: calculate offset manually
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const localTime = new Date(utcTime + now.getTimezoneOffset() * 60000);
      const targetTime = new Date(
        localTime.toLocaleString("en-US", { timeZone: timezone })
      );

      const offsetMs = targetTime.getTime() - now.getTime();
      const offsetHours = Math.floor(Math.abs(offsetMs) / (1000 * 60 * 60));
      const offsetMinutes = Math.floor(
        (Math.abs(offsetMs) % (1000 * 60 * 60)) / (1000 * 60)
      );

      const sign = offsetMs >= 0 ? "+" : "-";
      const hoursStr = offsetHours.toString().padStart(2, "0");
      const minutesStr = offsetMinutes.toString().padStart(2, "0");

      return `UTC${sign}${hoursStr}:${minutesStr}`;
    } catch (error) {
      console.error(`Error converting IANA timezone ${timezone}:`, error);
      return null;
    }
  }
}

export default new ScraperService();
