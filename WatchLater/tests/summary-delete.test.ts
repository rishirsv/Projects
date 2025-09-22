import fs from 'fs';
import path from 'path';
import { deleteSummaryByVideoId, deleteAllSummaries } from '../server.js';

type DeleteSummaryRequest = Parameters<typeof deleteSummaryByVideoId>[0];
type DeleteSummaryResponse = Parameters<typeof deleteSummaryByVideoId>[1];
type DeleteAllSummariesRequest = Parameters<typeof deleteAllSummaries>[0];
type DeleteAllSummariesResponse = Parameters<typeof deleteAllSummaries>[1];

const summariesDir = path.resolve(process.cwd(), 'exports', 'summaries');
const transcriptsDir = path.resolve(process.cwd(), 'exports', 'transcripts');

class MockResponse
  implements Pick<DeleteSummaryResponse, 'status' | 'setHeader' | 'getHeader' | 'json' | 'send'>
{
  statusCode = 200;
  headers = new Map<string, string>();
  body: unknown = undefined;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  setHeader(name: string, value: string) {
    this.headers.set(name.toLowerCase(), value);
  }

  getHeader(name: string) {
    return this.headers.get(name.toLowerCase());
  }

  json(payload: unknown) {
    this.body = payload;
    return this;
  }

  send(payload: unknown) {
    this.body = payload;
    return this;
  }
}

describe('Summary deletion endpoints', () => {
  const videoId = 'deleteTest123';
  const otherVideoId = 'deleteFriend456';
  const summaryOlder = `${videoId}__Sample-video-summary-2024-01-01T00-00-00.md`;
  const summaryNewer = `${videoId}__Sample-video-summary-2024-02-01T00-00-00.md`;
  const otherSummary = `${otherVideoId}__Another-video-summary-2024-03-01T00-00-00.md`;
  const transcriptName = `${videoId}__Sample-video-transcript-2024-01-01T00-00-00.txt`;

  const ensureDirs = async () => {
    await fs.promises.mkdir(summariesDir, { recursive: true });
    await fs.promises.mkdir(transcriptsDir, { recursive: true });
  };

  const cleanTestFiles = async () => {
    await ensureDirs();
    const summaryFiles = await fs.promises.readdir(summariesDir);
    await Promise.all(
      summaryFiles
        .filter((file) => file.startsWith(videoId) || file.startsWith(otherVideoId))
        .map((file) => fs.promises.rm(path.join(summariesDir, file), { force: true }))
    );
    const transcriptFiles = await fs.promises.readdir(transcriptsDir);
    await Promise.all(
      transcriptFiles
        .filter((file) => file.startsWith(videoId) || file.startsWith(otherVideoId))
        .map((file) => fs.promises.rm(path.join(transcriptsDir, file), { force: true }))
    );
  };

  beforeEach(async () => {
    await cleanTestFiles();
  });

  afterAll(async () => {
    await cleanTestFiles();
  });

  const writeSummary = async (name: string) => {
    await ensureDirs();
    const filePath = path.join(summariesDir, name);
    await fs.promises.writeFile(filePath, `# Summary for ${name}\n\nContent`);
    return filePath;
  };

  const writeTranscript = async (name: string) => {
    await ensureDirs();
    const filePath = path.join(transcriptsDir, name);
    await fs.promises.writeFile(filePath, `Transcript for ${name}`);
    return filePath;
  };

  it('deletes only the latest summary for a video by default', async () => {
    await writeSummary(summaryOlder);
    await new Promise((resolve) => setTimeout(resolve, 10));
    await writeSummary(summaryNewer);

    const req = { params: { videoId }, query: {} } as unknown as DeleteSummaryRequest;
    const res = new MockResponse();

    await deleteSummaryByVideoId(req, res as unknown as DeleteSummaryResponse);

    expect(res.statusCode).toBe(200);
    const payload = res.body as { deletedCount: number; deletedFiles: string[] };
    expect(payload.deletedCount).toBe(1);

    const remaining = await fs.promises.readdir(summariesDir);
    expect(remaining).toContain(summaryOlder);
    expect(remaining).not.toContain(summaryNewer);
  });

  it('deletes all summaries for a video when all=true is provided', async () => {
    await writeSummary(summaryOlder);
    await new Promise((resolve) => setTimeout(resolve, 10));
    await writeSummary(summaryNewer);

    const req = { params: { videoId }, query: { all: 'true' } } as unknown as DeleteSummaryRequest;
    const res = new MockResponse();

    await deleteSummaryByVideoId(req, res as unknown as DeleteSummaryResponse);

    expect(res.statusCode).toBe(200);
    const payload = res.body as { deletedCount: number; deletedFiles: string[]; deleteAll: boolean };
    expect(payload.deleteAll).toBe(true);
    expect(payload.deletedCount).toBe(2);

    const remaining = await fs.promises.readdir(summariesDir);
    expect(remaining).not.toContain(summaryOlder);
    expect(remaining).not.toContain(summaryNewer);
  });

  it('returns 400 for invalid video identifiers', async () => {
    const req = { params: { videoId: '../evil' }, query: {} } as unknown as DeleteSummaryRequest;
    const res = new MockResponse();

    await deleteSummaryByVideoId(req, res as unknown as DeleteSummaryResponse);

    expect(res.statusCode).toBe(400);
    const payload = res.body as { error?: string };
    expect(payload?.error).toMatch(/valid video id/i);
  });

  const backupFiles = async (dir: string) => {
    await ensureDirs();
    const entries = await fs.promises.readdir(dir, { withFileTypes: true }).catch(() => []);
    const backup = new Map<string, Buffer>();
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const filePath = path.join(dir, entry.name);
      const contents = await fs.promises.readFile(filePath);
      backup.set(entry.name, contents);
    }
    return backup;
  };

  const restoreFiles = async (dir: string, backup: Map<string, Buffer>) => {
    await ensureDirs();
    for (const [name, contents] of backup.entries()) {
      const filePath = path.join(dir, name);
      if (!fs.existsSync(filePath)) {
        await fs.promises.writeFile(filePath, contents);
      }
    }
  };

  it('deleteAllSummaries respects includeTranscripts flag', async () => {
    const existingSummaries = await backupFiles(summariesDir);
    const existingTranscripts = await backupFiles(transcriptsDir);

    try {
      await writeSummary(summaryOlder);
      await writeTranscript(transcriptName);

      const reqNoTranscripts = { query: {} } as unknown as DeleteAllSummariesRequest;
      const resNoTranscripts = new MockResponse();

      await deleteAllSummaries(reqNoTranscripts, resNoTranscripts as unknown as DeleteAllSummariesResponse);

      expect(resNoTranscripts.statusCode).toBe(200);
      const payloadNoTranscripts = resNoTranscripts.body as { deletedSummaries: number; deletedTranscripts: number };
      expect(payloadNoTranscripts.deletedSummaries).toBeGreaterThanOrEqual(1);
      expect(payloadNoTranscripts.deletedTranscripts).toBe(0);
      expect(fs.existsSync(path.join(transcriptsDir, transcriptName))).toBe(true);

      // Recreate files and include transcripts in deletion
      await writeSummary(summaryOlder);
      await writeTranscript(transcriptName);

      const reqIncludeTranscripts = { query: { includeTranscripts: 'true' } } as unknown as DeleteAllSummariesRequest;
      const resIncludeTranscripts = new MockResponse();

      await deleteAllSummaries(
        reqIncludeTranscripts,
        resIncludeTranscripts as unknown as DeleteAllSummariesResponse
      );

      expect(resIncludeTranscripts.statusCode).toBe(200);
      const payloadInclude = resIncludeTranscripts.body as { deletedSummaries: number; deletedTranscripts: number };
      expect(payloadInclude.deletedSummaries).toBeGreaterThanOrEqual(1);
      expect(payloadInclude.deletedTranscripts).toBeGreaterThanOrEqual(1);
      expect(fs.existsSync(path.join(transcriptsDir, transcriptName))).toBe(false);
    } finally {
      await restoreFiles(summariesDir, existingSummaries);
      await restoreFiles(transcriptsDir, existingTranscripts);
    }
  });

  it('does not delete summaries for other videos when target video is removed', async () => {
    await writeSummary(summaryOlder);
    await writeSummary(otherSummary);

    const req = { params: { videoId }, query: {} } as unknown as DeleteSummaryRequest;
    const res = new MockResponse();

    await deleteSummaryByVideoId(req, res as unknown as DeleteSummaryResponse);

    const remaining = await fs.promises.readdir(summariesDir);
    expect(remaining).toContain(otherSummary);
  });
});
