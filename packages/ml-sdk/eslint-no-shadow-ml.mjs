/**
 * ESLint — No Shadow ML Rule
 *
 * Prevents direct imports of @nzila/db ML schema tables or @nzila/ml-core
 * in app code. All ML data access must go through @nzila/ml-sdk.
 *
 * Mirrors the pattern established by @nzila/ai-sdk/eslint-no-shadow-ai.
 *
 * Usage in your eslint.config.mjs:
 *
 *   import noShadowMl from '@nzila/ml-sdk/eslint-no-shadow-ml'
 *   export default [
 *     ...otherConfigs,
 *     noShadowMl,
 *   ]
 */

/** @type {import('eslint').Linter.FlatConfig} */
const noShadowMlConfig = {
  name: 'nzila/no-shadow-ml',
  files: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
  ],
  // Exclude API routes — they are the governance boundary and MUST
  // access the DB directly to serve the SDK clients.
  ignores: ['app/api/**', 'app/portal/api/**'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@nzila/ml-core', '@nzila/ml-core/*'],
            message:
              'Direct @nzila/ml-core imports are prohibited in app code. Use @nzila/ml-sdk for all ML data access. See packages/ml-sdk/README.md.',
          },
        ],
        paths: [
          {
            name: '@nzila/db',
            message:
              'Importing @nzila/db directly for ML data is prohibited. Use @nzila/ml-sdk. If you need non-ML data, this import is fine — but never query ml* tables directly.',
          },
          {
            name: '@nzila/db/schema',
            importNames: [
              'mlModels',
              'mlDatasets',
              'mlTrainingRuns',
              'mlInferenceRuns',
              'mlScoresStripeDaily',
              'mlScoresStripeTxn',
              'mlModelStatusEnum',
              'mlRunStatusEnum',
            ],
            message:
              'Direct ML table imports are prohibited. Use @nzila/ml-sdk for all ML signals. See governance/ai/AI_MODEL_MANAGEMENT.md.',
          },
        ],
      },
    ],
  },
}

export default noShadowMlConfig
