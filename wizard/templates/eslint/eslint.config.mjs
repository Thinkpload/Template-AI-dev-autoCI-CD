// Compatible with eslint ^9.19.0 and typescript-eslint ^8.23.0
// Review if major version bumps change flat config API
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);
