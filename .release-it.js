import { execSync } from 'node:child_process';

// release-it only creates the GitHub release through the API when this variable is set.
process.env.GITHUB_TOKEN ??= execSync('gh auth token', { encoding: 'utf8' }).trim();

/** @type {import('release-it').Config} */
export default {
  hooks: {
    'before:init': ['npm run check', 'npm test'],
    'after:bump': 'npm run build',
  },
  git: {
    requireBranch: 'main',
    commitMessage: 'chore: release v${version}',
    tagName: 'v${version}',
  },
  github: {
    release: true,
    releaseName: 'v${version}',
  },
};
