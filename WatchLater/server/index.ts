import express from 'express';
import cors from 'cors';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json()); // For parsing application/json

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

app.post('/api/summarize', async (req, res) => {
  try {
    const { transcript, prompt: basePrompt } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `${basePrompt}\n\n### TRANSCRIPT\n${transcript}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ summary: response.text() });
  } catch (error) {
    console.error('Error summarizing:', error);
    res.status(500).json({ error: 'Failed to summarize' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
