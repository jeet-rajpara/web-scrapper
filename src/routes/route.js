import { Router } from 'express';
import fetchProfileData from '../controllers/profileController.js';

const router = Router();

// Define the route to scrape profiles
router.post('/scrape-profiles', fetchProfileData);

export default router;
