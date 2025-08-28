// eslint.config.mjs
// @ts-check
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  // 0) 무시 경로
  { ignores: ['.next/**', 'node_modules/**', 'dist/**', 'coverage/**'] },

  // 1) JS 권장
  js.configs.recommended,

  // 2) TS 권장 (⚠️ 타입체크 없는 버전: 설정 간단, 빠름)
  ...tseslint.configs.recommended,

  // 3) Prettier 권장(충돌 룰 off + 포맷 이슈 경고)
  prettierRecommended,

  // 4) 공통 옵션/규칙
  {
    languageOptions: {
      parserOptions: {
        // 타입체크 없는 구성이라 projectService 불필요 (간단/안정)
        // 타입체크 기반 규칙을 쓰려면 아래 '옵션 A' 참고
      },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // 경고 위주
      'no-console': 'warn',

      // TS 쪽은 JS 기본 룰 끄고 TS 룰만 사용
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      '@typescript-eslint/no-explicit-any': 'warn',
      'prettier/prettier': 'warn',
    },
  },
);
