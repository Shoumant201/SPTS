import { getEnvironmentConfig } from '../swagger';
import { isSwaggerEnabled, createSwaggerUIOptions, getEnvironmentSummary } from '../swaggerOptions';

// Mock environment variables
const originalEnv = process.env;

describe('Environment-specific Swagger Configuration', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getEnvironmentConfig', () => {
    it('should detect development environment correctly', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3001';
      process.env.HOST = 'localhost';
      process.env.API_VERSION = '1.0.0';

      const config = getEnvironmentConfig();

      expect(config.isDevelopment).toBe(true);
      expect(config.isProduction).toBe(false);
      expect(config.isStaging).toBe(false);
      expect(config.baseUrl).toBe('http://localhost:3001');
      expect(config.apiVersion).toBe('1.0.0');
    });

    it('should detect production environment correctly', () => {
      process.env.NODE_ENV = 'production';
      process.env.PRODUCTION_URL = 'https://api.sptm.com';
      process.env.API_VERSION = '2.0.0';

      const config = getEnvironmentConfig();

      expect(config.isDevelopment).toBe(false);
      expect(config.isProduction).toBe(true);
      expect(config.isStaging).toBe(false);
      expect(config.baseUrl).toBe('https://api.sptm.com');
      expect(config.apiVersion).toBe('2.0.0');
    });

    it('should detect staging environment correctly', () => {
      process.env.NODE_ENV = 'staging';
      process.env.STAGING_URL = 'https://staging-api.sptm.com';

      const config = getEnvironmentConfig();

      expect(config.isDevelopment).toBe(false);
      expect(config.isProduction).toBe(false);
      expect(config.isStaging).toBe(true);
      expect(config.baseUrl).toBe('https://staging-api.sptm.com');
    });

    it('should use environment-specific URLs', () => {
      process.env.NODE_ENV = 'development';
      process.env.DEV_URL = 'http://dev.example.com';
      process.env.STAGING_URL = 'https://staging.example.com';
      process.env.PRODUCTION_URL = 'https://prod.example.com';

      const config = getEnvironmentConfig();

      expect(config.developmentUrl).toBe('http://dev.example.com');
      expect(config.stagingUrl).toBe('https://staging.example.com');
      expect(config.productionUrl).toBe('https://prod.example.com');
      expect(config.baseUrl).toBe('http://dev.example.com');
    });
  });

  describe('isSwaggerEnabled', () => {
    it('should enable Swagger in development by default', () => {
      const config = { isDevelopment: true, isProduction: false, isStaging: false } as any;
      expect(isSwaggerEnabled(config)).toBe(true);
    });

    it('should enable Swagger in staging by default', () => {
      const config = { isDevelopment: false, isProduction: false, isStaging: true } as any;
      expect(isSwaggerEnabled(config)).toBe(true);
    });

    it('should disable Swagger in production by default', () => {
      const config = { isDevelopment: false, isProduction: true, isStaging: false } as any;
      expect(isSwaggerEnabled(config)).toBe(false);
    });

    it('should respect SWAGGER_ENABLED environment variable', () => {
      process.env.SWAGGER_ENABLED = 'false';
      const config = { isDevelopment: true, isProduction: false, isStaging: false } as any;
      expect(isSwaggerEnabled(config)).toBe(false);

      process.env.SWAGGER_ENABLED = 'true';
      const prodConfig = { isDevelopment: false, isProduction: true, isStaging: false } as any;
      expect(isSwaggerEnabled(prodConfig)).toBe(true);
    });
  });

  describe('createSwaggerUIOptions', () => {
    it('should configure development-specific options', () => {
      const config = { 
        isDevelopment: true, 
        isProduction: false, 
        isStaging: false 
      } as any;

      const options = createSwaggerUIOptions(config);

      expect(options.swaggerOptions?.tryItOutEnabled).toBe(true);
      expect(options.swaggerOptions?.displayOperationId).toBe(true);
      expect(options.swaggerOptions?.showMutatedRequest).toBe(true);
      expect(options.swaggerOptions?.defaultModelsExpandDepth).toBe(2);
      expect(options.swaggerOptions?.supportedSubmitMethods).toContain('delete');
      expect(options.customSiteTitle).toContain('Development');
    });

    it('should configure production-specific options', () => {
      const config = { 
        isDevelopment: false, 
        isProduction: true, 
        isStaging: false 
      } as any;

      const options = createSwaggerUIOptions(config);

      expect(options.swaggerOptions?.displayOperationId).toBe(false);
      expect(options.swaggerOptions?.showMutatedRequest).toBe(false);
      expect(options.swaggerOptions?.defaultModelsExpandDepth).toBe(1);
      expect(options.swaggerOptions?.supportedSubmitMethods).toEqual(['get', 'post']);
      expect(options.swaggerOptions?.validatorUrl).toBeNull();
      expect(options.customSiteTitle).not.toContain('Development');
    });

    it('should configure staging-specific options', () => {
      const config = { 
        isDevelopment: false, 
        isProduction: false, 
        isStaging: true 
      } as any;

      const options = createSwaggerUIOptions(config);

      expect(options.customSiteTitle).toContain('Staging');
      expect(options.customCss).toContain('STAGING');
    });

    it('should respect environment variables for Swagger options', () => {
      process.env.SWAGGER_TRY_IT_OUT = 'false';
      process.env.SWAGGER_DEEP_LINKING = 'false';
      process.env.SWAGGER_VALIDATOR_URL = 'https://custom-validator.com';

      const config = { 
        isDevelopment: true, 
        isProduction: false, 
        isStaging: false 
      } as any;

      const options = createSwaggerUIOptions(config);

      expect(options.swaggerOptions?.tryItOutEnabled).toBe(false);
      expect(options.swaggerOptions?.deepLinking).toBe(false);
      expect(options.swaggerOptions?.validatorUrl).toBe('https://custom-validator.com');
    });
  });

  describe('getEnvironmentSummary', () => {
    it('should return development features summary', () => {
      const config = { isDevelopment: true, isProduction: false, isStaging: false } as any;
      const summary = getEnvironmentSummary(config);

      expect(summary).toContain('Development Mode');
      expect(summary).toContain('Extended Logging');
      expect(summary).toContain('All HTTP Methods Enabled');
    });

    it('should return production features summary', () => {
      const config = { isDevelopment: false, isProduction: true, isStaging: false } as any;
      const summary = getEnvironmentSummary(config);

      expect(summary).toContain('Production Mode');
      expect(summary).toContain('Security Optimized');
      expect(summary).toContain('Read-only Operations');
    });

    it('should return staging features summary', () => {
      const config = { isDevelopment: false, isProduction: false, isStaging: true } as any;
      const summary = getEnvironmentSummary(config);

      expect(summary).toContain('Staging Mode');
      expect(summary).toContain('Limited HTTP Methods');
      expect(summary).toContain('Production-like Behavior');
    });
  });
});