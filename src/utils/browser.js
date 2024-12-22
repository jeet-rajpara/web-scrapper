import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';
import { logger } from './logger.js';
import 'chromedriver';

export class BrowserAutomation {
    constructor(email, password) {
        this.email = email;
        this.password = password;
        this.driver = null;
        this.cookiesFile = 'cookies.json';
        this.isInitialized = false;
    }

    async initialize() {
        try {
            const options = new chrome.Options();
            options.addArguments('--log-level=3');
            this.driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();
            this.isInitialized = true;
        } catch (error) {
            logger.error('Failed to initialize browser:', error);
            throw new Error('Browser initialization failed');
        }
    }

    async saveCookies() {
        try {
            const cookies = await this.driver.manage().getCookies();
            fs.writeFileSync(this.cookiesFile, JSON.stringify(cookies, null, 2));
            logger.info('Cookies saved successfully');
        } catch (error) {
            logger.error('Failed to save cookies:', error);
        }
    }

    async loadCookies() {
        try {
            if (fs.existsSync(this.cookiesFile)) {
                const cookies = JSON.parse(fs.readFileSync(this.cookiesFile, 'utf8'));
                for (const cookie of cookies) {
                    await this.driver.manage().addCookie(cookie);
                }
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Failed to load cookies:', error);
            return false;
        }
    }

    async loginToLinkedIn() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            await this.driver.get('https://www.linkedin.com/login');

            // Try to use saved cookies first
            if (await this.loadCookies()) {
                logger.info('Using saved cookies for login');
                await this.driver.get('https://www.linkedin.com/');
                if (await this.isLoggedIn()) {
                    return true;
                }
            }

            logger.info('Performing fresh login');
            await this.performLogin();
            await this.saveCookies();
            return true;
        } catch (error) {
            logger.error('LinkedIn login failed:', error);
            throw new Error('Login failed');
        }
    }

    async performLogin() {
        await this.driver.wait(until.elementLocated(By.id('username')), 10000);
        await this.driver.findElement(By.id('username')).sendKeys(this.email);
        await this.driver.findElement(By.id('password')).sendKeys(this.password);
        await this.driver.findElement(By.css('button[type="submit"]')).click();
        await this.driver.wait(until.elementLocated(By.id('global-nav')), 10000);
    }

    async isLoggedIn() {
        try {
            await this.driver.wait(until.elementLocated(By.id('global-nav')), 5000);
            return true;
        } catch {
            return false;
        }
    }

    async scrapeProfile(profileUrl) {
        try {
            await this.driver.get(profileUrl);
            await this.driver.wait(
                until.elementLocated(By.className('pv-top-card-profile-picture__container')),
                10000
            );

            const pageSource = await this.driver.getPageSource();
            return pageSource;
        } catch (error) {
            logger.error(`Failed to load profile ${profileUrl}:`, error);
            throw new Error('Profile scraping failed');
        }
    }

    async close() {
        if (this.driver) {
            await this.driver.quit();
            this.isInitialized = false;
        }
    }
}