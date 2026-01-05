import globals from 'globals'
import mocha from 'eslint-plugin-mocha'
import react from 'eslint-plugin-react'
import tseslint from 'typescript-eslint'

export default [
  ...tseslint.configs.recommended,
  mocha.configs.recommended,
  react.configs.flat.recommended,
  {
    rules: {
      'mocha/no-mocha-arrows': 'off'
    }
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.mocha
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }
]