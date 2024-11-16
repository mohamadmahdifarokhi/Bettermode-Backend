const common = [
  '--require-module ts-node/register',
  '--require ./features/bootstrap/**/*.ts',
  '--require ./features/steps/**/*.ts',
  '--format progress',
  '--format summary',
  '--backtrace',
  './features/tests/**/*.feature',
  '--publish-quiet',
  '--exit',
];

export default common.join(' ');
