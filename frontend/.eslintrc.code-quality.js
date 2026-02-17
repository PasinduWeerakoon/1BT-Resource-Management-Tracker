/**
 * ESLint Configuration for Code Quality
 * Rules to enforce ES6+ features and best practices
 * 
 * Note: This is a reference configuration. 
 * To use, merge these rules into your main .eslintrc file
 */
module.exports = {
  rules: {
    // Prefer arrow functions
    'prefer-arrow-callback': 'warn',
    'arrow-body-style': ['warn', 'as-needed'],
    
    // Prefer const/let over var
    'no-var': 'error',
    'prefer-const': 'warn',
    
    // Destructuring
    'prefer-destructuring': ['warn', {
      array: false,
      object: true
    }],
    
    // Template literals
    'prefer-template': 'warn',
    
    // Optional chaining and nullish coalescing
    'no-unused-expressions': 'off', // Allow optional chaining
    
    // Import organization
    'import/order': ['warn', {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true
      }
    }],
    
    // Naming conventions
    'camelcase': ['warn', {
      properties: 'always',
      ignoreDestructuring: false,
      ignoreImports: false,
      ignoreGlobals: false
    }],
    
    // Error handling
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'warn',
    
    // React best practices
    'react/prop-types': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    
    // Code organization
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
  }
};
