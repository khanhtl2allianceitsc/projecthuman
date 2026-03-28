// scripts/kill-ports.mjs
// Kill processes trên port 3001 và 5173 trước khi start dev server
import { execSync } from 'child_process';

const ports = [4000, 5173];

for (const port of ports) {
  try {
    const result = execSync(
      `netstat -ano | findstr :${port} | findstr LISTENING`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const pids = [...new Set(
      result.trim().split('\n')
        .map(line => line.trim().split(/\s+/).pop())
        .filter(Boolean)
    )];
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`[kill-ports] Killed PID ${pid} on port ${port}`);
      } catch {}
    }
  } catch {
    // Port not in use — no-op
  }
}
