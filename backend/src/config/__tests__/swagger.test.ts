import { getEnvironmentConfig, getServerConfigurations, createSwaggerConfig } from '../swagger';

describe('Swagger Server Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getEnvironmentConfig', () => {
    it('should return development configuration', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3001';
      process.env.HOST = 'localhost';
      process.env.DEV_URL = 'http://localhost:3001';
      process.env.STAGING_URL = 'https://staging-api.sptm.com';
      process.env.PRODUCTION_URL = 'https://api.sptm.com';
      process.env.API_VERSION = '1.0.0';

      const config = getEnvironmentConfig();

      expect(config.isDevelopment).toBe(true);
      expect(config.isProduction).toBe(false);
      expect(config.isStaging).toBe(false);
      expect(config.baseUrl).toBe('http://localhost:3001');
      expect(config.apiVersion).toBe('1.0.0');
      expect(config.developmentUrl).toBe('http://localhost:3001');
      expect(config.stagingUrl).toBe('https://staging-api.sptm.com');
      expect(config.productionUrl).toBe('https://api.sptm.com');
    });

    it('should return production configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.PRODUCTION_URL = 'https://api.sptm.com';

      const config = getEnvironmentConfig();

      expect(config.isDevelopment).toBe(false);
      expect(config.isProduction).toBe(true);
      expect(config.isStaging).toBe(false);
      expect(config.baseUrl).toBe('https://api.sptm.com');
    });

    it('should return staging configuration', () => {
      process.env.NODE_ENV = 'staging';
      process.env.STAGING_URL = 'https://staging-api.sptm.com';

      const config = getEnvironmentConfig();

      expect(config.isDevelopment).toBe(false);
      expect(config.isProduction).toBe(false);
      expect(config.isStaging).toBe(true);
      expect(config.baseUrl).toBe('https://staging-api.sptm.com');
    });

    it('should use default values when environment variables are not set', () => {
      delete process.env.NODE_ENV;
      delete process.env.PORT;
      delete process.env.HOST;
      delete process.env.API_VERSION;

      const config = getEnvironmentConfig();

      expect(config.isDevelopment).toBe(true);
      expect(config.baseUrl).toBe('http://localhost:3001');
      expect(config.apiVersion).toBe('1.0.0');
    });
  });

  describe('getServerConfigurations', () => {
    it('should return multiple servers for development environment', () => {
      const config = {
        isDevelopment: true,
        isProduction: false,
        isStaging: false,
        baseUrl: 'http://localhost:3001',
        apiVersion: '1.0.0',
        developmentUrl: 'http://localhost:3001',
        stagingUrl: 'https://staging-api.sptm.com',
        productionUrl: 'https://api.sptm.com'
      };

      const servers = getServerConfigurations(config);

      expect(servers).toHaveLength(3);
      expect(servers[0].url).toBe('http://localhost:3001');
      expect(servers[0].description).toBe('Development server (current)');
      expect(servers[1].url).toBe('https://staging-api.sptm.com');
      expect(servers[1].description).toBe('Staging server (for testing)');
      expect(servers[2].url).toBe('https://api.sptm.com');
      expect(servers[2].description).toBe('Production server (live)');
    });

    it('should return only current server for production environment', () => {
      const config = {
        isDevelopment: false,
        isProduction: true,
        isStaging: false,
        baseUrl: 'https://api.sptm.com',
        apiVersion: '1.0.0',
        developmentUrl: 'http://localhost:3001',
        stagingUrl: 'https://staging-api.sptm.com',
        productionUrl: 'https://api.sptm.com'
      };

      const servers = getServerConfigurations(config);

      expect(servers).toHaveLength(1);
      expect(servers[0].url).toBe('https://api.sptm.com');
      expect(servers[0].description).toBe('Production server (current)');
    });

    it('should return staging and production servers for staging environment', () => {
      const config = {
        isDevelopment: false,
        isProduction: false,
        isStaging: true,
        baseUrl: 'https://staging-api.sptm.com',
        apiVersion: '1.0.0',
        developmentUrl: 'http://localhost:3001',
        stagingUrl: 'https://staging-api.sptm.com',
        productionUrl: 'https://api.sptm.com'
      };

      const servers = getServerConfigurations(config);

      expect(servers).toHaveLength(2);
      expect(servers[0].url).toBe('https://staging-api.sptm.com');
      expect(servers[0].description).toBe('Staging server (current)');
      expect(servers[1].url).toBe('https://api.sptm.com');
      expect(servers[1].description).toBe('Production server (live)');
    });

    it('should include server variables for all servers', () => {
      const config = {
        isDevelopment: true,
        isProduction: false,
        isStaging: false,
        baseUrl: 'http://localhost:3001',
        apiVersion: '1.0.0',
        developmentUrl: 'http://localhost:3001',
        stagingUrl: 'https://staging-api.sptm.com',
        productionUrl: 'https://api.sptm.com'
      };

      const servers = getServerConfigurations(config);

      servers.forEach(server => {
        expect(server.variables).toBeDefined();
        expect(server.variables?.version).toBeDefined();
        expect(server.variables?.version.default).toBe('v1');
        expect(server.variables?.version.enum).toEqual(['v1']);
      });

      // Development server should have protocol variable
      expect(servers[0].variables?.protocol).toBeDefined();
      expect(servers[0].variables?.protocol.default).toBe('http');
    });
  });

  describe('createSwaggerConfig', () => {
    it('should create complete swagger configuration', () => {
      const envConfig = {
        isDevelopment: true,
        isProduction: false,
        isStaging: false,
        baseUrl: 'http://localhost:3001',
        apiVersion: '1.0.0',
        developmentUrl: 'http://localhost:3001',
        stagingUrl: 'https://staging-api.sptm.com',
        productionUrl: 'https://api.sptm.com'
      };

      const config = createSwaggerConfig(envConfig);

      expect(config.definition.openapi).toBe('3.0.0');
      expect(config.definition.info.title).toBe('SPTM Backend API');
      expect(config.definition.info.version).toBe('1.0.0');
      expect(config.definition.servers).toHaveLength(3);
      expect(config.definition.components.securitySchemes).toBeDefined();
      expect(config.definition.components.securitySchemes?.BearerAuth).toBeDefined();
      expect(config.definition.components.securitySchemes?.AppContext).toBeDefined();
      expect(config.apis).toEqual([
        './src/routes/*.ts',
        './src/controllers/*.ts',
        './src/schemas/*.ts'
      ]);
    });

    it('should include proper security schemes', () => {
      const envConfig = getEnvironmentConfig();
      const config = createSwaggerConfig(envConfig);

      const securitySchemes = config.definition.components.securitySchemes;
      expect(securitySchemes?.BearerAuth).toEqual({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from login endpoint. Include as: Authorization: Bearer <token>'
      });

      expect(securitySchemes?.AppContext).toEqual({
        type: 'apiKey',
        in: 'header',
        name: 'X-App-Context',
        description: 'Application context header. Required values: web-dashboard, driver-app, or passenger-app'
      });
    });

    it('should include proper response definitions', () => {
      const envConfig = getEnvironmentConfig();
      const config = createSwaggerConfig(envConfig);

      const responses = config.definition.components.responses;
      expect(responses?.ValidationError).toBeDefined();
      expect(responses?.AuthenticationError).toBeDefined();
      expect(responses?.AuthorizationError).toBeDefined();
      expect(responses?.ConflictError).toBeDefined();
      expect(responses?.RateLimitError).toBeDefined();
      expect(responses?.ServerError).toBeDefined();
    });

    it('should include proper tags', () => {
      const envConfig = getEnvironmentConfig();
      const config = createSwaggerConfig(envConfig);

      const tags = config.definition.tags;
      expect(tags).toBeDefined();
      expect(tags?.length).toBeGreaterThan(0);
      
      const tagNames = tags?.map(tag => tag.name);
      expect(tagNames).toContain('Authentication');
      expect(tagNames).toContain('Web Dashboard Authentication');
      expect(tagNames).toContain('Mobile App Authentication');
      expect(tagNames).toContain('Token Management');
      expect(tagNames).toContain('User Profile');
      expect(tagNames).toContain('Public');
      expect(tagNames).toContain('System');
    });
  });
});