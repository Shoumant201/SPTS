import { Options } from 'swagger-jsdoc';

// TypeScript interfaces for Swagger configuration
export interface SwaggerConfig {
  definition: OpenAPIDefinition;
  apis: string[];
}

export interface OpenAPIDefinition {
  openapi: string;
  info: APIInfo;
  servers: ServerInfo[];
  components: ComponentsSchema;
  security?: SecurityRequirement[];
  tags?: TagDefinition[];
}

export interface APIInfo {
  title: string;
  version: string;
  description: string;
  contact?: ContactInfo;
  license?: LicenseInfo;
}

export interface ContactInfo {
  name: string;
  email: string;
  url?: string;
}

export interface LicenseInfo {
  name: string;
  url?: string;
}

export interface ServerInfo {
  url: string;
  description: string;
  variables?: Record<string, ServerVariable>;
}

export interface ServerVariable {
  default: string;
  description?: string;
  enum?: string[];
}

export interface ComponentsSchema {
  schemas?: Record<string, SchemaDefinition>;
  securitySchemes?: Record<string, SecurityScheme>;
  responses?: Record<string, ResponseDefinition>;
  parameters?: Record<string, ParameterDefinition>;
  examples?: Record<string, ExampleDefinition>;
}

export interface SchemaDefinition {
  type?: string;
  properties?: Record<string, PropertyDefinition>;
  required?: string[];
  description?: string;
  example?: any;
  enum?: string[];
  format?: string;
  items?: SchemaDefinition;
  oneOf?: SchemaDefinition[];
  allOf?: SchemaDefinition[];
  anyOf?: SchemaDefinition[];
  $ref?: string;
  nullable?: boolean;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

export interface PropertyDefinition {
  type?: string;
  description?: string;
  example?: any;
  format?: string;
  enum?: string[];
  $ref?: string;
  nullable?: boolean;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  items?: SchemaDefinition;
}

export interface SecurityScheme {
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect';
  scheme?: string;
  bearerFormat?: string;
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  flows?: OAuthFlows;
  openIdConnectUrl?: string;
}

export interface OAuthFlows {
  implicit?: OAuthFlow;
  password?: OAuthFlow;
  clientCredentials?: OAuthFlow;
  authorizationCode?: OAuthFlow;
}

export interface OAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface ResponseDefinition {
  description: string;
  content?: Record<string, MediaTypeDefinition>;
  headers?: Record<string, HeaderDefinition>;
}

export interface MediaTypeDefinition {
  schema?: SchemaDefinition;
  examples?: Record<string, ExampleDefinition>;
}

export interface HeaderDefinition {
  description?: string;
  schema?: SchemaDefinition;
  example?: any;
}

export interface ParameterDefinition {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: SchemaDefinition;
  example?: any;
}

export interface ExampleDefinition {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

export interface SecurityRequirement {
  [key: string]: string[];
}

export interface TagDefinition {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
}

export interface ExternalDocumentation {
  description?: string;
  url: string;
}

// Environment-specific configuration
export interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;
  baseUrl: string;
  apiVersion: string;
  developmentUrl: string;
  stagingUrl: string;
  productionUrl: string;
}

// Swagger UI customization options
export interface SwaggerUIOptions {
  customCss?: string;
  customSiteTitle?: string;
  customfavIcon?: string;
  swaggerOptions?: SwaggerUISwaggerOptions;
  explorer?: boolean;
}

export interface SwaggerUISwaggerOptions {
  docExpansion?: 'list' | 'full' | 'none';
  filter?: boolean;
  showExtensions?: boolean;
  showCommonExtensions?: boolean;
  tryItOutEnabled?: boolean;
  requestInterceptor?: (request: any) => any;
  responseInterceptor?: (response: any) => any;
  onComplete?: () => void;
  onFailure?: (error: any) => void;
  apisSorter?: 'alpha';
  operationsSorter?: 'alpha' | 'method';
  defaultModelsExpandDepth?: number;
  defaultModelExpandDepth?: number;
  defaultModelRendering?: 'example' | 'model';
  displayOperationId?: boolean;
  displayRequestDuration?: boolean;
  deepLinking?: boolean;
  showMutatedRequest?: boolean;
  supportedSubmitMethods?: string[];
  validatorUrl?: string | null;
}

// Server configurations for different environments
export const getServerConfigurations = (env: EnvironmentConfig): ServerInfo[] => {
  const servers: ServerInfo[] = [];

  // Always include the current environment server first
  servers.push({
    url: env.baseUrl,
    description: env.isDevelopment 
      ? 'Development server (current)' 
      : env.isProduction 
        ? 'Production server (current)' 
        : env.isStaging
          ? 'Staging server (current)'
          : 'Current server',
    variables: {
      version: {
        default: 'v1',
        description: 'API version',
        enum: ['v1']
      },
      protocol: {
        default: env.isDevelopment ? 'http' : 'https',
        description: 'Protocol scheme',
        enum: ['http', 'https']
      }
    }
  });

  // In development, also show staging and production servers for reference
  if (env.isDevelopment) {
    if (env.stagingUrl && env.stagingUrl !== env.baseUrl) {
      servers.push({
        url: env.stagingUrl,
        description: 'Staging server (for testing)',
        variables: {
          version: {
            default: 'v1',
            description: 'API version',
            enum: ['v1']
          }
        }
      });
    }
    
    if (env.productionUrl && env.productionUrl !== env.baseUrl) {
      servers.push({
        url: env.productionUrl,
        description: 'Production server (live)',
        variables: {
          version: {
            default: 'v1',
            description: 'API version',
            enum: ['v1']
          }
        }
      });
    }
  }

  // In staging, also show production server for reference
  if (env.isStaging && env.productionUrl && env.productionUrl !== env.baseUrl) {
    servers.push({
      url: env.productionUrl,
      description: 'Production server (live)',
      variables: {
        version: {
          default: 'v1',
          description: 'API version',
          enum: ['v1']
        }
      }
    });
  }

  return servers;
};

// Main Swagger configuration factory
export const createSwaggerConfig = (env: EnvironmentConfig): SwaggerConfig => {
  const config: SwaggerConfig = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'SPTM Backend API',
        version: env.apiVersion,
        description: `
          Smart Public Transport Management (SPTM) Backend API
          
          This API provides comprehensive endpoints for managing a multi-tier public transport system.
          It supports different user types (Super Admin, Admin, Organization, Driver, Passenger) with
          context-aware authentication and role-based access control.
          
          ## Authentication Flows
          
          The API uses JWT (JSON Web Tokens) for authentication with context-aware routing.
          Each user type has specific authentication endpoints and access patterns:
          
          ### Web Dashboard Authentication
          - **Super Admin**: \`POST /api/auth/web/super-admin/login\`
          - **Admin**: \`POST /api/auth/web/admin/login\`
          - **Organization**: \`POST /api/auth/web/organization/login\`
          
          ### Mobile App Authentication
          - **Driver Login**: \`POST /api/auth/mobile/driver/login\`
          - **Driver Registration**: \`POST /api/auth/mobile/driver/register\`
          - **Passenger Login**: \`POST /api/auth/mobile/passenger/login\`
          - **Passenger Registration**: \`POST /api/auth/mobile/passenger/register\`
          
          ### Universal Endpoints
          - **Logout**: \`POST /api/auth/logout\` (no authentication required)
          - **Profile**: \`GET /api/auth/me\`, \`GET /api/auth/profile\`
          - **Token Refresh**: Context-specific refresh endpoints
          
          ## Context Header Requirements
          
          The \`X-App-Context\` header is **REQUIRED** for most authentication endpoints:
          
          | Context | Allowed Roles | Description |
          |---------|---------------|-------------|
          | \`web-dashboard\` | SUPER_ADMIN, ADMIN, ORGANIZATION | Web dashboard access |
          | \`driver-app\` | DRIVER | Driver mobile app access |
          | \`passenger-app\` | PASSENGER | Passenger mobile app access |
          
          ### Context Validation Rules
          1. Context header must match user's role capabilities
          2. Web dashboard users cannot access mobile endpoints
          3. Mobile app users cannot access web dashboard endpoints
          4. Context mismatch results in 401 Unauthorized error
          
          ## JWT Token Structure
          
          **Access Token** (15 minutes validity):
          \`\`\`json
          {
            "sub": "user_id",
            "name": "User Name",
            "role": "DRIVER|PASSENGER|ADMIN|ORGANIZATION|SUPER_ADMIN",
            "userType": "USER|ORGANIZATION|ADMIN|SUPER_ADMIN",
            "organizationId": "org_xxxxxxxxx", // for drivers only
            "context": "web-dashboard|driver-app|passenger-app",
            "iat": 1732876800,
            "exp": 1732877700
          }
          \`\`\`
          
          **Refresh Token** (7-30 days validity based on user type):
          \`\`\`json
          {
            "sub": "user_id",
            "type": "refresh",
            "userType": "SUPER_ADMIN|ADMIN|ORGANIZATION|USER",
            "context": "web-dashboard|driver-app|passenger-app",
            "iat": 1732876800,
            "exp": 1733481600
          }
          \`\`\`
          
          ## Token Expiration Policies
          
          ### Role-Based Expiration Times
          
          | User Type | Access Token | Refresh Token | Security Level |
          |-----------|--------------|---------------|----------------|
          | SUPER_ADMIN | 30 minutes | 7 days | Highest |
          | ADMIN | 1 hour | 7 days | High |
          | ORGANIZATION | 2 hours | 14 days | Medium |
          | USER (Driver/Passenger) | 4 hours | 30 days | Standard |
          
          ### Token Renewal Process
          
          1. **Automatic Refresh**: Clients should refresh tokens before expiration
          2. **Token Rotation**: Each refresh generates new access and refresh tokens
          3. **Context Validation**: Refresh requests must match original context
          4. **Database Validation**: Refresh tokens are validated against stored values
          5. **User Status Check**: User account status is verified during refresh
          
          ### Refresh Endpoints by Context
          
          **Web Dashboard**:
          - \`POST /api/auth/web/super-admin/refresh-token\`
          - \`POST /api/auth/web/admin/refresh-token\`
          - \`POST /api/auth/web/organization/refresh-token\`
          
          **Mobile Apps**:
          - \`POST /api/auth/mobile/driver/refresh-token\`
          - \`POST /api/auth/mobile/passenger/refresh-token\`
          
          ## User Type Hierarchy & Access Control
          
          The SPTM system implements a multi-tier user hierarchy with role-based access control (RBAC) and organization boundaries.
          
          ### User Type Hierarchy (Highest to Lowest Authority)
          
          | User Type | Role | Authority Level | Organization Boundary | Context Access |
          |-----------|------|-----------------|----------------------|----------------|
          | **SUPER_ADMIN** | SUPER_ADMIN | 4 (Highest) | None | web-dashboard |
          | **ADMIN** | ADMIN | 3 | None | web-dashboard |
          | **ORGANIZATION** | ORGANIZATION | 2 | Own Organization | web-dashboard |
          | **USER (Driver)** | DRIVER | 1 | Own Organization | driver-app |
          | **USER (Passenger)** | PASSENGER | 1 | None | passenger-app |
          
          ### User Type Definitions
          
          #### SUPER_ADMIN (Authority Level 4)
          - **Purpose**: System-wide administration and oversight
          - **Access**: Unrestricted access to all system resources
          - **Permissions**: 
            - Manage all admins, organizations, and users
            - Access all system metrics and configurations
            - Override any organizational boundaries
            - Full CRUD operations on all resources
          - **Organization Boundary**: None (can access all organizations)
          - **Context**: web-dashboard only
          - **Login Endpoint**: \`POST /api/auth/web/super-admin/login\`
          
          #### ADMIN (Authority Level 3)
          - **Purpose**: Regional or system-level administration
          - **Access**: Cross-organizational management capabilities
          - **Permissions**:
            - Create and manage organizations
            - Manage routes, vehicles, and system-wide configurations
            - Approve/reject verification requests
            - Access system metrics and reports
            - Cannot manage other admins or super admins
          - **Organization Boundary**: None (can access all organizations)
          - **Context**: web-dashboard only
          - **Login Endpoint**: \`POST /api/auth/web/admin/login\`
          
          #### ORGANIZATION (Authority Level 2)
          - **Purpose**: Organization-specific management
          - **Access**: Limited to own organization's resources
          - **Permissions**:
            - Manage drivers within their organization
            - Manage vehicles assigned to their organization
            - View routes and trips related to their organization
            - Update organization profile and settings
            - Cannot access other organizations' data
          - **Organization Boundary**: Strict (own organization only)
          - **Context**: web-dashboard only
          - **Login Endpoint**: \`POST /api/auth/web/organization/login\`
          
          #### USER - DRIVER (Authority Level 1)
          - **Purpose**: Vehicle operation and trip management
          - **Access**: Limited to own profile and assigned resources
          - **Permissions**:
            - View and update own profile
            - View assigned vehicle information
            - View assigned routes
            - Update trip status and information
            - Cannot access other drivers' data
          - **Organization Boundary**: Strict (own organization only)
          - **Context**: driver-app only
          - **Registration**: \`POST /api/auth/mobile/driver/register\` (requires organizationId)
          - **Login Endpoint**: \`POST /api/auth/mobile/driver/login\`
          
          #### USER - PASSENGER (Authority Level 1)
          - **Purpose**: Trip booking and profile management
          - **Access**: Limited to own profile and public resources
          - **Permissions**:
            - View and update own profile
            - Book and manage own trips
            - View public routes and schedules
            - Apply for and manage discount profiles
            - Submit verification documents
          - **Organization Boundary**: None (not tied to specific organization)
          - **Context**: passenger-app only
          - **Registration**: \`POST /api/auth/mobile/passenger/register\` (no organizationId required)
          - **Login Endpoint**: \`POST /api/auth/mobile/passenger/login\`
          
          ### Access Control Rules
          
          #### Hierarchical Access
          - Higher authority levels can access resources of lower levels within their scope
          - SUPER_ADMIN can access all resources without restrictions
          - ADMIN can access organization and user resources but not other admin resources
          - ORGANIZATION can only access their own organization's resources
          - USER level (DRIVER/PASSENGER) can only access their own resources
          
          #### Organization Boundary Enforcement
          - **No Boundary**: SUPER_ADMIN, ADMIN, PASSENGER
          - **Strict Boundary**: ORGANIZATION, DRIVER
          - Organization boundary violations result in 403 Forbidden errors
          
          #### Context-Based Access Control
          - **web-dashboard**: SUPER_ADMIN, ADMIN, ORGANIZATION
          - **driver-app**: DRIVER only
          - **passenger-app**: PASSENGER only
          - Context mismatches result in 401 Unauthorized errors
          
          ### Permission Matrix
          
          | Resource | SUPER_ADMIN | ADMIN | ORGANIZATION | DRIVER | PASSENGER |
          |----------|-------------|-------|--------------|--------|-----------|
          | System Config | Full | Read | None | None | None |
          | Admins | Full | None | None | None | None |
          | Organizations | Full | Full | Own Only | None | None |
          | Users/Drivers | Full | Read | Own Org | Own Profile | Own Profile |
          | Vehicles | Full | Read | Own Org | Assigned Only | Read Only |
          | Routes | Full | Full | Read | Read | Read |
          | Trips | Full | Read | Own Org | Own Only | Own Only |
          | Discounts | Full | Manage | None | None | Own Profile |
          | Verification | Full | Approve/Reject | None | None | Submit |
          
          ## Authentication Flow Examples
          
          ### Driver Registration & Login Flow
          1. **Get Organizations**: \`GET /api/auth/organizations/active\`
          2. **Register**: \`POST /api/auth/mobile/driver/register\` with organizationId
          3. **Login**: \`POST /api/auth/mobile/driver/login\`
          4. **Access Protected**: Use Bearer token with X-App-Context: driver-app
          
          ### Passenger Registration & Login Flow
          1. **Register**: \`POST /api/auth/mobile/passenger/register\` (no organizationId)
          2. **Login**: \`POST /api/auth/mobile/passenger/login\`
          3. **Access Protected**: Use Bearer token with X-App-Context: passenger-app
          
          ### Web Dashboard Login Flow
          1. **Login**: \`POST /api/auth/web/{role}/login\` (super-admin/admin/organization)
          2. **Access Protected**: Use Bearer token with X-App-Context: web-dashboard
          
          ## Error Handling
          
          Common authentication errors:
          - **401 Unauthorized**: Invalid credentials, expired tokens, context mismatch
          - **409 Conflict**: Account locked, email already exists
          - **429 Too Many Requests**: Rate limit exceeded
          - **400 Bad Request**: Validation errors, weak passwords
          
          ## Rate Limiting
          
          Authentication endpoints are rate-limited:
          - Login attempts: 5 per 15 minutes per IP
          - Registration: 3 per hour per IP
          - Token refresh: 10 per minute per user
          
          Rate limit headers are included in responses, and exceeded limits return HTTP 429.
        `,
        contact: {
          name: 'SPTM Development Team',
          email: 'dev@sptm.com'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: getServerConfigurations(env),
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token obtained from login endpoint. Include as: Authorization: Bearer <token>'
          },
          AppContext: {
            type: 'apiKey',
            in: 'header',
            name: 'X-App-Context',
            description: 'Application context header. Required values: web-dashboard, driver-app, or passenger-app'
          }
        },
        responses: {
          ValidationError: {
            description: 'Validation error - Invalid request data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          AuthenticationError: {
            description: 'Authentication failed - Invalid or missing credentials',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          AuthorizationError: {
            description: 'Authorization failed - Insufficient permissions',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          ConflictError: {
            description: 'Resource conflict - Duplicate or conflicting data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          RateLimitError: {
            description: 'Rate limit exceeded - Too many requests',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          SecurityError: {
            description: 'Security-related errors including account lockout and security violations',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          ServerError: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        },
        parameters: {
          AppContextHeader: {
            name: 'X-App-Context',
            in: 'header',
            required: true,
            description: 'Application context identifier',
            schema: {
              type: 'string',
              enum: ['web-dashboard', 'driver-app', 'passenger-app']
            }
          }
        }
      },
      security: [
        {
          BearerAuth: []
        }
      ],
      tags: [
        {
          name: 'Authentication',
          description: 'Universal authentication endpoints'
        },
        {
          name: 'Web Dashboard Authentication', 
          description: 'Authentication endpoints for web dashboard users (Super Admin, Admin, Organization)'
        },
        {
          name: 'Mobile App Authentication',
          description: 'Authentication endpoints for mobile app users (Driver, Passenger)'
        },
        {
          name: 'Token Management',
          description: 'JWT token refresh and management endpoints'
        },
        {
          name: 'User Profile',
          description: 'User profile and account management endpoints'
        },
        {
          name: 'Public',
          description: 'Public endpoints that do not require authentication'
        },
        {
          name: 'System',
          description: 'System health and utility endpoints'
        },
        {
          name: 'User Hierarchy',
          description: 'User type hierarchy, permissions, and access control documentation'
        }
      ]
    },
    apis: [
      './src/routes/*.ts',
      './src/controllers/*.ts',
      './src/schemas/*.ts',
      './src/schemas/swaggerSchemas.ts',
      './src/schemas/authFlowExamples.ts',
      './src/schemas/userHierarchyDocumentation.ts'
    ]
  };

  return config;
};

// Environment detection helper
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = process.env.PORT || '3001';
  const host = process.env.HOST || 'localhost';
  
  const isDevelopment = nodeEnv === 'development';
  const isProduction = nodeEnv === 'production';
  const isStaging = nodeEnv === 'staging';
  
  // Define URLs for all environments
  const developmentUrl = process.env.DEV_URL || `http://${host}:${port}`;
  const stagingUrl = process.env.STAGING_URL || 'https://staging-api.sptm.com';
  const productionUrl = process.env.PRODUCTION_URL || 'https://api.sptm.com';
  
  // Determine current base URL based on environment
  let baseUrl: string;
  if (isProduction) {
    baseUrl = productionUrl;
  } else if (isStaging) {
    baseUrl = stagingUrl;
  } else {
    baseUrl = developmentUrl;
  }

  // Log environment configuration for debugging
  if (isDevelopment) {
    console.log('🔧 Swagger Environment Configuration:');
    console.log(`   Environment: ${nodeEnv}`);
    console.log(`   Base URL: ${baseUrl}`);
    console.log(`   Development URL: ${developmentUrl}`);
    console.log(`   Staging URL: ${stagingUrl}`);
    console.log(`   Production URL: ${productionUrl}`);
    console.log(`   API Version: ${process.env.API_VERSION || '1.0.0'}`);
  }

  return {
    isDevelopment,
    isProduction,
    isStaging,
    baseUrl,
    apiVersion: process.env.API_VERSION || '1.0.0',
    developmentUrl,
    stagingUrl,
    productionUrl
  };
};

// Default Swagger configuration
export const swaggerConfig = createSwaggerConfig(getEnvironmentConfig());

// Export swagger-jsdoc options type for compatibility
export type SwaggerJSDocOptions = Options;