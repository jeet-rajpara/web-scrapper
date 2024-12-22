import dotenv from 'dotenv';
dotenv.config({ path: './.config/.env' });
import express, { json } from 'express';
import routes from './src/routes/route.js';
const app = express();
const PORT = process.env.PORT || 4550;
app.use(express.json());
app.use('/api', routes);
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});