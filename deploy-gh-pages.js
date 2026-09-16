const { execSync } = require('child_process');
const fs = require('fs');

const git = '"C:\\Program Files\\Git\\cmd\\git.exe"';

console.log('Building dist...');
execSync('npm.cmd run build', { stdio: 'inherit' });

console.log('Adding dist to git...');
execSync(`${git} add dist -f`, { stdio: 'inherit' });

try {
  execSync(`${git} commit -m "Deploy dist build to gh-pages"`, { stdio: 'inherit' });
} catch (e) {
  console.log('No changes to commit or already committed.');
}

console.log('Pushing dist to origin gh-pages...');
execSync(`${git} subtree push --prefix dist origin gh-pages`, { stdio: 'inherit' });

console.log('Done! gh-pages branch published successfully.');
