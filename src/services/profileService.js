import * as cheerio from 'cheerio';
import { createReadStream } from 'fs';
import csv from 'csv-parser';
import { BrowserAutomation } from '../utils/browser.js';
import { logger } from '../utils/logger.js';

let browserInstance = null;

export async function initializeBrowser() {
    if (!browserInstance) {
        browserInstance = new BrowserAutomation(
            process.env.LINKEDIN_EMAIL,
            process.env.LINKEDIN_PASSWORD
        );
        await browserInstance.loginToLinkedIn();
    }
    return browserInstance;
}

export async function processProfiles(filePath) {
    try {
        const profileUrls = await fetchProfilesFromCsv(filePath);
        const browser = await initializeBrowser();
        
        const results = [];
        for (const url of profileUrls) {
            try {
                const pageSource = await browser.scrapeProfile(url);
                const profileData = parseProfileData(pageSource, url);
                results.push(profileData);
                
                // Add delay between requests
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                logger.error(`Failed to process profile ${url}:`, error);
                results.push({
                    profileUrl: url,
                    error: 'Failed to process profile',
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        return results;
    } catch (error) {
        logger.error('Error in profile service:', error);
        throw new Error('Failed to process profiles');
    }
}

function parseProfileData(pageSource, profileUrl) {
    const $ = cheerio.load(pageSource);
    let status = 'No Status';
    
    const titleText = $('.pv-top-card-profile-picture__container img').map((_i, x) => $(x).attr('title'))[0]?.trim() || '';
    const arr = titleText.split(',');
    
    if (arr[1]?.includes('HIRING')) {
        status = 'Hiring';
    } else if (arr[1]?.includes('OPEN_TO_WORK')) {
        status = 'Open to Work';
    }

    return {
        profileUrl,
        name: arr[0]?.trim() || 'Name Not Found',
        status,
        timestamp: new Date().toISOString()
    };
}

async function fetchProfilesFromCsv(filePath) {
    return new Promise((resolve, reject) => {
        const profiles = [];
        createReadStream(filePath)
            .pipe(csv())
            .on('data', ({ profileUrl }) => profiles.push(profileUrl))
            .on('end', () => resolve(profiles))
            .on('error', reject);
    });
}

export async function cleanupBrowser() {
    if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
    }
}