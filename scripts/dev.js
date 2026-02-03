#!/usr/bin/env node
const { spawn } = require('child_process')
const path = require('path')

// Remove ELECTRON_RUN_AS_NODE from environment
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

// Also remove other VS Code related env vars that might interfere
delete env.VSCODE_AMD_ENTRYPOINT
delete env.VSCODE_CWD
delete env.VSCODE_NLS_CONFIG
delete env.VSCODE_CODE_CACHE_PATH
delete env.VSCODE_CRASH_REPORTER_PROCESS_TYPE
delete env.VSCODE_IPC_HOOK

console.log('Starting electron-vite dev...')
console.log('ELECTRON_RUN_AS_NODE:', env.ELECTRON_RUN_AS_NODE || '(not set)')

const electronVite = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['electron-vite', 'dev'],
  {
    cwd: path.join(__dirname, '..'),
    env: env,
    stdio: 'inherit',
    shell: true
  }
)

electronVite.on('error', (err) => {
  console.error('Failed to start:', err)
  process.exit(1)
})

electronVite.on('close', (code) => {
  process.exit(code)
})
