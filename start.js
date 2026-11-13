const { spawn } = require('child_process');

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  console.log('🚀 Launching FitLife AI in Production mode...');
  const backend = spawn('node', ['backend/src/index.js'], {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  process.on('SIGINT', () => { try { backend.kill(); } catch (e) {} process.exit(0); });
  process.on('SIGTERM', () => { try { backend.kill(); } catch (e) {} process.exit(0); });
} else {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🚀 Launching FitLife AI: Full-Stack Platform                 ');
  console.log('  • Backend API:   http://localhost:5000/api                  ');
  console.log('  • Frontend App:  http://localhost:5173                      ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // 1. Launch Express Backend
  const backend = spawn('node', ['backend/src/index.js'], {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  // 2. Launch Vite Frontend after short delay so backend is ready
  let frontend = null;
  setTimeout(() => {
    frontend = spawn('npm', ['run', 'dev', '--prefix', 'frontend'], {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });
  }, 1200);

  function cleanup() {
    console.log('\n🛑 Shutting down FitLife AI processes...');
    try { backend.kill(); } catch (e) {}
    try { if (frontend) frontend.kill(); } catch (e) {}
    process.exit(0);
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);
}
