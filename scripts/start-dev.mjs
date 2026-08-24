import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { unlink } from 'node:fs/promises';
const port = 3000;

const isPortInUse = () => new Promise((resolve) => {
    const socket = createConnection({ host: '127.0.0.1', port });
    socket.once('connect', () => {
        socket.destroy();
        resolve(true);
    });
    socket.once('error', () => resolve(false));
});

if (await isPortInUse()) {
    console.log(`Next.js is already running at http://localhost:${port}`);
    process.exit(0);
}

await unlink('.next/dev/lock').catch(() => {});
const nextCommand = process.platform === 'win32' ? 'next.cmd' : 'next';
const nextProcess = spawn(nextCommand, ['dev'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
});

nextProcess.on('exit', (code, signal) => {
    process.exit(code ?? (signal ? 1 : 0));
});
