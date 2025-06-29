import express from 'express';
import cors from 'cors';
import { YoutubeTranscript } from 'youtube-transcript-plus';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());

app.get('/api/transcript/:id', async (req, res) => {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(req.params.id);
    res.json(transcript);
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ error: 'Failed to fetch transcript' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
