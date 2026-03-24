'use strict';

module.exports = {
  extends: ['@commitlint/config-conventional'],
  // Ignore the legacy "Initial plan" commit that was created before
  // conventional-commit rules were enforced and cannot be rewritten
  // without a force-push.
  ignores: [(msg) => msg.trim() === 'Initial plan'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
        'deps',
      ],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'header-max-length': [2, 'always', 100],
    // Long URLs in commit trailers (Co-authored-by, Agent-Logs-Url, etc.)
    // legitimately exceed 100 chars.  The important guard is
    // header-max-length, which remains enforced above.
    'body-max-line-length': [0],
  },
};
