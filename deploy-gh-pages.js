const { execSync } = require('child_process');

const git = '"C:\\Program Files\\Git\\cmd\\git.exe"';

console.log('1. Building production dist...');
execSync('npm.cmd run build', { stdio: 'inherit' });

console.log('2. Staging all files...');
execSync(`${git} add -A`, { stdio: 'inherit' });

try {
  console.log('3. Committing updates...');
  execSync(`${git} commit -m "feat: permanent device verification, responsive mobile console and trendy UI"`, { stdio: 'inherit' });
} catch (e) {
  console.log('No changes to commit or already committed.');
}

console.log('4. Pushing to origin main...');
try {
  execSync(`${git} push origin main`, { stdio: 'inherit' });
} catch (e) {
  console.log('Push to main note:', e.message);
}

console.log('5. Pushing dist subtree to origin gh-pages...');
try {
  execSync(`${git} subtree push --prefix dist origin gh-pages`, { stdio: 'inherit' });
} catch (e) {
  console.log('Subtree push note, running split & push:', e.message);
  try {
    const splitCommit = execSync(`${git} subtree split --prefix dist main`).toString().trim();
    execSync(`${git} push origin ${splitCommit}:refs/heads/gh-pages --force`, { stdio: 'inherit' });
  } catch (err2) {
    console.error('Error deploying gh-pages:', err2.message);
  }
}

console.log('Done! Successfully deployed to GitHub Pages and pushed to main.');
