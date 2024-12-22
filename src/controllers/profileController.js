import {processProfiles } from '../services/profileService.js';

async function fetchProfileData(req, res) {
    const csvPath = './data/profiles.csv'; // Path to the CSV file
    try {
        const profiles = await processProfiles(csvPath);
        res.status(200).json({ success: true, data: profiles });
    } catch (error) {
        console.error('Error processing profiles:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export default fetchProfileData;