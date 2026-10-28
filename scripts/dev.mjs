// Starts the local dependencies (docker compose) and every service in watch mode.
import { spawn, spawnSync } from 'node:child_process';

const services = [
  { name: 'iam', color: 36 },
  { name: 'catalog', color: 33 },
  { name: 'learning', color: 32 },
  { name: 'notify', color: 34 },
  { name: 'gateway', color: 35 },
];

const up = spawnSync('docker', ['compose', 'up', '-d', '--wait'], { stdio: 'inherit', shell: true });
if (up.status !== 0) process.exit(up.status ?? 1);

const children = services.map(({ name, color }) => {
  const child = spawn('pnpm', ['exec', 'nest', 'start', name, '--watch', '--preserveWatchOutput'], { shell: true, env: process.env });
  const prefix = `\x1b[${color}m[${name}]\x1b[0m `;
  const pipe = (stream, out) =>
    stream.on('data', (chunk) => out.write(chunk.toString().split('\n').filter(Boolean).map((l) => prefix + l).join('\n') + '\n'));
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('exit', (code) => console.error(`${prefix}exited with ${code}`));
  return child;
});

const stop = () => {
  for (const c of children) c.kill('SIGINT');
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
