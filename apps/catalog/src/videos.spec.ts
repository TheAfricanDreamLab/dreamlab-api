import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { VideoManifestSchema } from '@dreamlab/contracts';
import { manifestOf, type ManifestInput } from './modules/videos/video-files';
import { audioArgs, folderBytes } from './modules/videos/video-worker';

const base: ManifestInput = {
  id: '0b5c8a52-3f1e-4c2a-9d7e-1a2b3c4d5e6f',
  version: 3,
  durationS: 95,
  width: 1280,
  height: 720,
  captions: [{ lang: 'en', label: 'English', source: 'auto', updatedAt: new Date(1_700_000_000_000) }],
};

describe('video manifest', () => {
  it('lists each stream’s size and the audio-only file of the current version', () => {
    const m = manifestOf({ ...base, sizes: { renditions: [{ height: 360, bytes: 4_100_000 }, { height: 720, bytes: 13_000_000 }], audio: { bytes: 780_000 } } });
    expect(VideoManifestSchema.parse(m)).toEqual(m);
    expect(m).toMatchObject({
      hls: 'v3/master.m3u8',
      renditions: [{ height: 360, bytes: 4_100_000 }, { height: 720, bytes: 13_000_000 }],
      audio: { src: 'v3/audio.m4a', bytes: 780_000 },
      captions: [{ lang: 'en', src: 'captions/en.vtt?v=1700000000000', auto: true }],
    });
  });

  it('leaves out the audio of a silent video, and both fields for videos processed before they existed', () => {
    const silent = manifestOf({ ...base, sizes: { renditions: [{ height: 360, bytes: 1000 }], audio: null } });
    expect(silent.renditions).toEqual([{ height: 360, bytes: 1000 }]);
    expect(silent).not.toHaveProperty('audio');
    const older = manifestOf({ ...base, sizes: null });
    expect(older).not.toHaveProperty('renditions');
    expect(older).not.toHaveProperty('audio');
    expect(VideoManifestSchema.safeParse(older).success).toBe(true);
  });

  it('weighs a rendition as the sum of its files', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rendition-'));
    try {
      writeFileSync(join(dir, 'index.m3u8'), 'x'.repeat(100));
      writeFileSync(join(dir, 'seg_0000.ts'), Buffer.alloc(2048));
      mkdirSync(join(dir, 'sub'));
      writeFileSync(join(dir, 'sub', 'seg_0001.ts'), Buffer.alloc(1000));
      expect(await folderBytes(dir)).toBe(3148);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;

describe('audio-only version', () => {
  (hasFfmpeg ? it : it.skip)('is mono AAC at about 64 kbps, with its index at the front', () => {
    const dir = mkdtempSync(join(tmpdir(), 'audio-'));
    try {
      const src = join(dir, 'clip.mp4');
      const made = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'testsrc=duration=3:size=320x240:rate=24', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=3', '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ac', '2', src]);
      expect(made.status).toBe(0);
      const out = join(dir, 'audio.m4a');
      expect(spawnSync('ffmpeg', audioArgs(src, out)).status).toBe(0);
      const probe = JSON.parse(spawnSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', out], { encoding: 'utf8' }).stdout) as { streams: { codec_type: string; codec_name: string; channels: number; bit_rate: string }[] };
      expect(probe.streams).toHaveLength(1);
      expect(probe.streams[0]).toMatchObject({ codec_type: 'audio', codec_name: 'aac', channels: 1 });
      expect(Number(probe.streams[0]!.bit_rate)).toBeLessThan(80_000);
      // faststart: the index (moov) comes before the audio data (mdat).
      const bytes = readFileSync(out);
      expect(bytes.indexOf('moov')).toBeLessThan(bytes.indexOf('mdat'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
