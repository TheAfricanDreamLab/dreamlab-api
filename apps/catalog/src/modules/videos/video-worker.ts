import { spawn } from 'node:child_process';
import { mkdir, readdir, readFile, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { Inject, Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common';
import { CAPTION_LANGUAGES, parseCaptions } from '@dreamlab/contracts';
import { InjectConfig } from '@lib/config';
import { InjectDatabase } from '@lib/database';
import { BlobStorage } from '@lib/storage';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import type { CatalogConfig } from '../../config';
import { CatalogDatabase, schema } from '../../database';
import { STORAGE } from '../authoring/authoring.service';
import { AUDIO_FILE, IMMUTABLE, sourcePath, versionFolder, writeCaptions, writeManifest, type StreamSizes } from './video-files';

const { videos, videoCaptions, videoJobs } = schema;
type JobRow = typeof videoJobs.$inferSelect;

/** A job's lease: renewed every LEASE_RENEW_MS while it runs; once it lapses another worker may take the job over. */
const LEASE_SECONDS = 120;
const LEASE_RENEW_MS = 30_000;
const MAX_ATTEMPTS = 3;
/** The container's health check reads this file's age. */
export const WORKER_ALIVE_FILE = join(tmpdir(), 'dreamlab-video-worker-alive');

/** A failure the author should hear about in these words; trying again won't help. */
class FinalError extends Error {}

interface Probe {
  durationS: number;
  width: number;
  height: number;
  audio: boolean;
}

/** Stream ladder: 360p always; 720p (or the original's height, if smaller) when the original is at least 540p. */
export function renditionsFor(height: number): number[] {
  const out = [Math.min(360, even(height))];
  if (height >= 540) out.push(Math.min(720, even(height)));
  return out;
}
const even = (n: number) => Math.max(2, Math.floor(n / 2) * 2);

/**
 * The audio-only version (LRN-9): mono AAC at 64 kbps, about 0.5 MB a minute, with the index at the
 * front so it starts playing before it has all downloaded.
 */
export function audioArgs(src: string, file: string): string[] {
  return ['-hide_banner', '-nostdin', '-y', '-i', src, '-map', '0:a:0', '-vn', '-c:a', 'aac', '-b:a', '64k', '-ac', '1', '-ar', '44100', '-movflags', '+faststart', file];
}

/** Total bytes of the files in a folder (one rendition's playlist and segments). */
export async function folderBytes(dir: string): Promise<number> {
  let total = 0;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) total += await folderBytes(join(dir, e.name));
    else total += (await stat(join(dir, e.name))).size;
  }
  return total;
}

const BITRATE: Record<'low' | 'high', { video: number; max: number }> = { low: { video: 700, max: 900 }, high: { video: 2200, max: 2800 } };

/**
 * The video worker (CAT-6). One job at a time, claimed from video_jobs with SKIP LOCKED so several
 * workers could share the queue. Processing makes HLS streams (H.264 + AAC, 6-second segments),
 * an audio-only version, a poster and a thumbnail; captions come from whisper.cpp. Everything
 * learners load is written to a new version folder, then the manifest is switched over to it.
 */
@Injectable()
export class VideoWorker implements OnApplicationShutdown {
  private readonly logger = new Logger('VideoWorker');
  private running = false;
  private stopping = false;
  private current: { job: JobRow; abort: AbortController } | null = null;
  private loop: Promise<void> | null = null;
  private alive: NodeJS.Timeout | null = null;

  constructor(
    @InjectDatabase() private readonly db: CatalogDatabase,
    @InjectConfig() private readonly config: CatalogConfig,
    @Inject(STORAGE) private readonly storage: BlobStorage,
  ) {}

  private get workDir(): string {
    return this.config.VIDEO_WORK_DIR ?? join(tmpdir(), 'dreamlab-videos');
  }

  start(): void {
    if (this.running) return;
    if (!this.storage.enabled) {
      this.logger.warn('Storage is not configured: the video worker is idle');
      return;
    }
    this.running = true;
    const touch = () => writeFile(WORKER_ALIVE_FILE, String(Date.now())).catch(() => undefined);
    void touch();
    this.alive = setInterval(() => void touch(), 20_000);
    this.loop = this.poll();
    this.logger.log(`Video worker started (threads ${this.config.VIDEO_THREADS})`);
  }

  async onApplicationShutdown(): Promise<void> {
    this.stopping = true;
    if (this.alive) clearInterval(this.alive);
    const job = this.current;
    if (job) {
      // Stop the tools and hand the job back without counting the attempt.
      job.abort.abort();
      await this.db.sys
        .update(videoJobs)
        .set({ status: 'queued', attempts: sql`greatest(${videoJobs.attempts} - 1, 0)`, leaseUntil: null, updatedAt: new Date() })
        .where(and(eq(videoJobs.id, job.job.id), eq(videoJobs.status, 'running')))
        .catch(() => undefined);
    }
    await this.loop?.catch(() => undefined);
  }

  /** Runs one queued job, if there is one (tests drive the worker with this). */
  async runOnce(): Promise<boolean> {
    const job = await this.claim();
    if (!job) return false;
    await this.execute(job);
    return true;
  }

  private async poll(): Promise<void> {
    while (!this.stopping) {
      let worked = false;
      try {
        worked = await this.runOnce();
      } catch (err) {
        this.logger.error(`Video worker loop: ${message(err)}`);
      }
      if (!worked && !this.stopping) await new Promise((r) => setTimeout(r, this.config.VIDEO_POLL_MS));
    }
  }

  /** The oldest queued job, or a running one whose worker stopped renewing its lease. */
  private async claim(): Promise<JobRow | null> {
    const result = await this.db.sys.execute(sql`
      update video_jobs set status = 'running', attempts = attempts + 1, lease_until = now() + make_interval(secs => ${LEASE_SECONDS}), updated_at = now()
      where id = (
        select id from video_jobs
        where status = 'queued' or (status = 'running' and lease_until < now())
        order by created_at
        for update skip locked
        limit 1
      )
      returning id`);
    const id = (result.rows[0] as { id?: string } | undefined)?.id;
    if (!id) return null;
    const [job] = await this.db.sys.select().from(videoJobs).where(eq(videoJobs.id, id));
    return job ?? null;
  }

  private async execute(job: JobRow): Promise<void> {
    if (job.attempts > MAX_ATTEMPTS) {
      await this.fail(job, 'Processing stopped several times part-way. Try again, or upload the video again.');
      return;
    }
    const abort = new AbortController();
    this.current = { job, abort };
    const renew = setInterval(() => {
      void this.db.sys
        .update(videoJobs)
        .set({ leaseUntil: sql`now() + make_interval(secs => ${LEASE_SECONDS})` })
        .where(and(eq(videoJobs.id, job.id), eq(videoJobs.status, 'running')))
        .catch((err: unknown) => this.logger.warn(`Lease renewal failed: ${message(err)}`));
    }, LEASE_RENEW_MS);
    const dir = join(this.workDir, job.id);
    try {
      await rm(dir, { recursive: true, force: true });
      await mkdir(dir, { recursive: true });
      if (job.kind === 'process') await this.process(job, dir, abort.signal);
      else await this.captions(job, dir, abort.signal);
      await this.db.sys.update(videoJobs).set({ status: 'done', leaseUntil: null, error: null, updatedAt: new Date() }).where(eq(videoJobs.id, job.id));
    } catch (err) {
      if (this.stopping) return;
      this.logger.error(`Job ${job.id} (${job.kind}, video ${job.videoId}) failed: ${message(err)}`);
      if (err instanceof FinalError || job.attempts >= MAX_ATTEMPTS) await this.fail(job, err instanceof FinalError ? err.message : friendly(job.kind));
      else
        await this.db.sys
          .update(videoJobs)
          .set({ status: 'queued', leaseUntil: null, error: message(err).slice(0, 500), updatedAt: new Date() })
          .where(eq(videoJobs.id, job.id));
    } finally {
      clearInterval(renew);
      this.current = null;
      await rm(dir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private async fail(job: JobRow, text: string): Promise<void> {
    await this.db.sys.update(videoJobs).set({ status: 'failed', leaseUntil: null, error: text, updatedAt: new Date() }).where(eq(videoJobs.id, job.id));
    if (job.kind === 'process') await this.db.sys.update(videos).set({ status: 'failed', progress: null, error: text, updatedAt: new Date() }).where(eq(videos.id, job.videoId));
  }

  // ---------- processing ----------

  private async process(job: JobRow, dir: string, signal: AbortSignal): Promise<void> {
    const [video] = await this.db.sys.select().from(videos).where(eq(videos.id, job.videoId));
    if (!video) return;
    await this.progress(video.id, 0, 'processing');
    const src = join(dir, 'source');
    // Only the bytes that were checked when the upload finished.
    await this.storage.downloadToFile('private', sourcePath(video.id), src, video.size);
    const probe = await this.probe(src, signal);
    const heights = renditionsFor(probe.height);
    const out = join(dir, 'out');
    await mkdir(out, { recursive: true });

    // Converting is ~90% of the work, shared out by rendition size; uploading the rest.
    const weights = heights.map((h) => h * h);
    const total = weights.reduce((a, b) => a + b, 0);
    let done = 0;
    const variants: string[] = [];
    for (const [i, h] of heights.entries()) {
      const name = `${h}p`;
      await mkdir(join(out, name), { recursive: true });
      const rate = h > 400 ? BITRATE.high : BITRATE.low;
      const width = even((probe.width * h) / probe.height);
      await this.run(
        this.config.FFMPEG_PATH,
        [
          '-hide_banner', '-nostdin', '-y', '-i', src,
          '-map', '0:v:0', ...(probe.audio ? ['-map', '0:a:0'] : []),
          '-vf', `scale=${width}:${h}:flags=bicubic,format=yuv420p`,
          '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'main', '-crf', '23',
          '-maxrate', `${rate.max}k`, '-bufsize', `${rate.max * 2}k`,
          '-force_key_frames', 'expr:gte(t,n_forced*6)', '-sc_threshold', '0',
          ...(probe.audio ? ['-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '48000'] : ['-an']),
          '-threads', String(this.config.VIDEO_THREADS),
          '-f', 'hls', '-hls_time', '6', '-hls_playlist_type', 'vod', '-hls_flags', 'independent_segments',
          '-hls_segment_filename', join(out, name, 'seg_%04d.ts'),
          '-progress', 'pipe:1', '-nostats',
          join(out, name, 'index.m3u8'),
        ],
        signal,
        (line) => {
          const m = /^out_time_ms=(\d+)/.exec(line);
          if (!m || !probe.durationS) return;
          const part = Math.min(1, Number(m[1]) / 1_000_000 / probe.durationS);
          void this.progress(video.id, Math.round(((done + part * weights[i]!) / total) * 90));
        },
      );
      done += weights[i]!;
      const bandwidth = (rate.max + (probe.audio ? 128 : 0)) * 1000;
      const codecs = `${h > 400 ? 'avc1.4d401f' : 'avc1.4d401e'}${probe.audio ? ',mp4a.40.2' : ''}`;
      variants.push(`#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},AVERAGE-BANDWIDTH=${(rate.video + (probe.audio ? 128 : 0)) * 1000},RESOLUTION=${width}x${h},CODECS="${codecs}"\n${name}/index.m3u8`);
    }
    await writeFile(join(out, 'master.m3u8'), `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-INDEPENDENT-SEGMENTS\n${variants.join('\n')}\n`);

    // What each stream costs in data, and a version to listen to when even 360p is too much.
    const sizes: StreamSizes = { renditions: [], audio: null };
    for (const h of heights) sizes.renditions.push({ height: h, bytes: await folderBytes(join(out, `${h}p`)) });
    if (probe.audio) {
      await this.run(this.config.FFMPEG_PATH, audioArgs(src, join(out, AUDIO_FILE)), signal);
      sizes.audio = { bytes: (await stat(join(out, AUDIO_FILE))).size };
    }

    // A poster from early in the video (past any fade-in), and a small thumbnail.
    const at = Math.min(Math.max(probe.durationS * 0.1, 1), 8, Math.max(probe.durationS - 0.5, 0));
    const frame = (file: string, height: number) =>
      this.run(this.config.FFMPEG_PATH, ['-hide_banner', '-nostdin', '-y', '-ss', at.toFixed(2), '-i', src, '-frames:v', '1', '-vf', `scale=-2:${height}`, '-q:v', '3', join(out, file)], signal);
    await frame('poster.jpg', Math.min(720, even(probe.height)));
    await frame('thumb.jpg', 180);
    await this.progress(video.id, 92);

    const version = video.version + 1;
    await this.uploadFolder(out, versionFolder(video.id, version));
    const [updated] = await this.db.sys
      .update(videos)
      .set({ status: 'ready', progress: null, error: null, durationS: Math.max(1, Math.round(probe.durationS)), width: probe.width, height: probe.height, renditions: heights, streamSizes: sizes, version, updatedAt: new Date() })
      .where(eq(videos.id, video.id))
      .returning();
    const tracks = await this.db.sys.select().from(videoCaptions).where(eq(videoCaptions.videoId, video.id)).orderBy(videoCaptions.lang);
    await writeManifest(this.storage, { id: video.id, version, durationS: updated!.durationS!, width: probe.width, height: probe.height, captions: tracks, sizes });
    // The version before the last stays for players that loaded the old manifest; older ones go.
    if (version > 2) await this.storage.removeAll('public', versionFolder(video.id, version - 2)).catch(() => undefined);
  }

  private async probe(file: string, signal: AbortSignal): Promise<Probe> {
    let json = '';
    try {
      await this.run(this.config.FFPROBE_PATH, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file], signal, undefined, (chunk) => (json += chunk));
    } catch {
      throw new FinalError('This file could not be read as a video. Export it again as an MP4 and upload that.');
    }
    const data = JSON.parse(json || '{}') as { format?: { duration?: string }; streams?: { codec_type?: string; width?: number; height?: number; duration?: string; side_data_list?: { rotation?: number }[]; tags?: { rotate?: string } }[] };
    const v = data.streams?.find((s) => s.codec_type === 'video' && s.width && s.height);
    if (!v) throw new FinalError('This file has no video picture in it.');
    const duration = Number(data.format?.duration ?? v.duration ?? 0);
    if (!duration || duration < 0.5) throw new FinalError('This video is too short to play.');
    if (duration > 36_000) throw new FinalError('Videos can be up to 10 hours long.');
    // Phones record sideways and mark the rotation; the picture is upright once rotated.
    const rotation = Math.abs(Number(v.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? v.tags?.rotate ?? 0)) % 180;
    const [width, height] = rotation === 90 ? [v.height!, v.width!] : [v.width!, v.height!];
    return { durationS: duration, width: even(width), height: even(height), audio: !!data.streams?.some((s) => s.codec_type === 'audio') };
  }

  // ---------- captions ----------

  private async captions(job: JobRow, dir: string, signal: AbortSignal): Promise<void> {
    const [video] = await this.db.sys.select().from(videos).where(eq(videos.id, job.videoId));
    if (!video) return;
    const src = join(dir, 'source');
    // Only the bytes that were checked when the upload finished.
    await this.storage.downloadToFile('private', sourcePath(video.id), src, video.size);
    const wav = join(dir, 'audio.wav');
    try {
      await this.run(this.config.FFMPEG_PATH, ['-hide_banner', '-nostdin', '-y', '-i', src, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', wav], signal);
    } catch {
      throw new FinalError('This video has no sound to make captions from.');
    }
    try {
      await stat(this.config.WHISPER_MODEL);
    } catch {
      throw new FinalError('Automatic captions are not available on this server yet. Upload a caption file instead.');
    }
    const lang = job.lang && job.lang !== 'auto' ? job.lang.split('-')[0]! : 'auto';
    let detected = lang;
    try {
      await this.run(
        this.config.WHISPER_PATH,
        ['-m', this.config.WHISPER_MODEL, '-f', wav, '-l', lang, '-t', String(this.config.VIDEO_THREADS), '-ovtt', '-of', join(dir, 'captions'), '-pp'],
        signal,
        undefined,
        undefined,
        (line) => {
          const d = /auto-detected language:\s*([a-z]{2,3})/.exec(line);
          if (d) detected = d[1]!;
        },
      );
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') throw new FinalError('Automatic captions are not available on this server yet. Upload a caption file instead.');
      throw err;
    }
    let cues;
    try {
      cues = parseCaptions(await readFile(join(dir, 'captions.vtt'), 'utf8'));
    } catch {
      throw new FinalError('No speech was found in this video.');
    }
    const code = job.lang && job.lang !== 'auto' ? job.lang : detected === 'auto' ? 'en' : detected;
    const [own] = await this.db.sys
      .select({ source: videoCaptions.source })
      .from(videoCaptions)
      .where(and(eq(videoCaptions.videoId, video.id), eq(videoCaptions.lang, code), ne(videoCaptions.source, 'auto')));
    if (own) throw new FinalError(`This video already has ${CAPTION_LANGUAGES[code] ?? code} captions that were uploaded or edited. Remove them first to make new ones automatically.`);
    const values = { label: `${CAPTION_LANGUAGES[code] ?? code} (automatic)`, source: 'auto' as const, cues, updatedByUserId: job.requestedByUserId, updatedAt: new Date() };
    // In one statement: an author's track saved while this ran is never replaced.
    const written = await this.db.sys
      .insert(videoCaptions)
      .values({ videoId: video.id, lang: code, ownerOrgId: video.ownerOrgId, ...values })
      .onConflictDoUpdate({ target: [videoCaptions.videoId, videoCaptions.lang], set: values, setWhere: eq(videoCaptions.source, 'auto') })
      .returning({ lang: videoCaptions.lang });
    if (!written.length) throw new FinalError(`${CAPTION_LANGUAGES[code] ?? code} captions were uploaded or edited while these were being made, so they were kept.`);
    await writeCaptions(this.storage, video.id, code, cues);
    // Earlier failed attempts are no longer news.
    await this.db.sys
      .update(videoJobs)
      .set({ status: 'done', updatedAt: new Date() })
      .where(and(eq(videoJobs.videoId, video.id), eq(videoJobs.kind, 'captions'), inArray(videoJobs.status, ['failed']), ne(videoJobs.id, job.id)));
    const tracks = await this.db.sys.select().from(videoCaptions).where(eq(videoCaptions.videoId, video.id)).orderBy(videoCaptions.lang);
    if (video.status === 'ready' && video.durationS && video.width && video.height) {
      await writeManifest(this.storage, { id: video.id, version: video.version, durationS: video.durationS, width: video.width, height: video.height, captions: tracks, sizes: video.streamSizes });
    }
  }

  // ---------- helpers ----------

  private lastProgress = new Map<string, number>();
  private async progress(id: string, pct: number, status?: 'processing'): Promise<void> {
    const last = this.lastProgress.get(id);
    if (!status && last !== undefined && pct - last < 2) return;
    this.lastProgress.set(id, pct);
    await this.db.sys
      .update(videos)
      .set({ progress: Math.min(100, Math.max(0, pct)), ...(status ? { status } : {}), updatedAt: new Date() })
      .where(eq(videos.id, id))
      .catch(() => undefined);
  }

  private async uploadFolder(local: string, prefix: string): Promise<void> {
    const files: string[] = [];
    const walk = async (d: string): Promise<void> => {
      for (const e of await readdir(d, { withFileTypes: true })) {
        if (e.isDirectory()) await walk(join(d, e.name));
        else files.push(join(d, e.name));
      }
    };
    await walk(local);
    const type = (f: string) =>
      f.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : f.endsWith('.ts') ? 'video/mp2t' : f.endsWith('.jpg') ? 'image/jpeg' : f.endsWith('.m4a') ? 'audio/mp4' : 'application/octet-stream';
    // A few at a time: segments are small, and the VM's bandwidth is shared.
    for (let i = 0; i < files.length; i += 6) {
      await Promise.all(
        files.slice(i, i + 6).map((f) => this.storage.put('public', `${prefix}${relative(local, f).split('\\').join('/')}`, { file: f }, type(f), IMMUTABLE)),
      );
    }
  }

  /** Runs a tool; rejects with its last error lines when it fails. */
  private run(
    cmd: string,
    args: string[],
    signal: AbortSignal,
    onStdoutLine?: (line: string) => void,
    onStdout?: (chunk: string) => void,
    onStderrLine?: (line: string) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args, { signal, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
      let tail = '';
      let outBuf = '';
      let errBuf = '';
      child.stdout.setEncoding('utf8').on('data', (chunk: string) => {
        onStdout?.(chunk);
        if (!onStdoutLine) return;
        outBuf += chunk;
        const lines = outBuf.split('\n');
        outBuf = lines.pop() ?? '';
        lines.forEach(onStdoutLine);
      });
      child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
        tail = (tail + chunk).slice(-2000);
        if (!onStderrLine) return;
        errBuf += chunk;
        const lines = errBuf.split(/\r?\n|\r/);
        errBuf = lines.pop() ?? '';
        lines.forEach(onStderrLine);
      });
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(Object.assign(new Error(`${cmd} exited with ${code}: ${tail.trim().split('\n').slice(-3).join(' | ')}`), { code }));
      });
    });
  }
}

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));
const friendly = (kind: string) =>
  kind === 'process' ? 'Processing failed. Try again; if it fails again, export the video as an MP4 and upload that.' : 'Making captions failed. Try again, or upload a caption file.';

/** Touches the alive file now (used by tests and the health check script). */
export async function touchAlive(): Promise<void> {
  const now = new Date();
  await utimes(WORKER_ALIVE_FILE, now, now).catch(() => writeFile(WORKER_ALIVE_FILE, String(now.getTime())));
}
