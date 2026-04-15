const { execSync } = require('child_process');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch(err) {
  process.exit(1);
}
