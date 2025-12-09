/**
 * API Schema for Aspire Hosting Resources
 * 
 * This file defines the complete API schema for Aspire resources,
 * derived from the public APIs of NuGet packages. It serves as the
 * source of truth for:
 * - Available resource types and their builder methods
 * - Method parameters and their types/constraints
 * - Chaining methods (WithReference, WaitFor, etc.)
 * - Return types and resource capabilities
 * - Validation rules for code generation
 * 
 * This schema enables:
 * 1. Semantically correct code generation
 * 2. Compile-time validation of configurations
 * 3. Intelligent autocomplete and suggestions
 * 4. Connection compatibility validation
 */

// ============================================================================
// Core Type Definitions
// ============================================================================

/**
 * Represents a C# type with its namespace and generic parameters
 */
export interface CSharpType {
  name: string;
  namespace: string;
  fullName: string;
  genericParameters?: CSharpType[];
  isNullable?: boolean;
}

/**
 * Represents a parameter in a method signature
 */
export interface MethodParameter {
  name: string;
  type: CSharpType;
  isRequired: boolean;
  defaultValue?: string | number | boolean | null;
  description?: string;
  constraints?: ParameterConstraints;
}

/**
 * Constraints that can be applied to parameters
 */
export interface ParameterConstraints {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  minValue?: number;
  maxValue?: number;
  allowedValues?: (string | number)[];
  mustBeCSharpIdentifier?: boolean;
  mustBeValidPath?: boolean;
  mustBeValidPort?: boolean;
  mustBeValidUrl?: boolean;
}

/**
 * Represents a method in the Aspire API
 */
export interface ApiMethod {
  name: string;
  description: string;
  parameters: MethodParameter[];
  returnType: CSharpType;
  genericConstraints?: string[];
  isExtensionMethod: boolean;
  extensionType?: string;
  xmlDocumentation?: string;
}

/**
 * Represents a chaining method available on a resource builder
 */
export interface ChainingMethod extends ApiMethod {
  /** Which resource types this method is available for */
  availableFor: ResourceCategory[];
  /** Whether this method can be called multiple times */
  canBeCalledMultipleTimes: boolean;
  /** Methods that must be called before this one */
  prerequisiteMethods?: string[];
  /** Methods that conflict with this one */
  conflictingMethods?: string[];
}

/**
 * Resource categories
 */
export type ResourceCategory = 
  | 'database' 
  | 'cache' 
  | 'messaging' 
  | 'ai' 
  | 'compute' 
  | 'project'
  | 'container'
  | 'storage';

/**
 * Represents the complete API definition for a resource type
 */
export interface ResourceApiDefinition {
  id: string;
  name: string;
  displayName: string;
  category: ResourceCategory;
  package: string;
  packageVersion: string;
  
  /** The builder method (e.g., AddPostgres) */
  builderMethod: ApiMethod;
  
  /** Child resource methods (e.g., AddDatabase on PostgresServerResource) */
  childResourceMethods?: ApiMethod[];
  
  /** Chaining methods available for this resource */
  availableChainingMethods: string[];
  
  /** The return type of the builder (e.g., IResourceBuilder<PostgresServerResource>) */
  builderReturnType: CSharpType;
  
  /** Connection string format template */
  connectionStringFormat?: string;
  
  /** What resources this can connect to */
  canConnectTo?: string[];
  
  /** What resources can connect to this */
  canBeReferencedBy?: string[];
  
  /** Validation rules specific to this resource */
  validationRules?: ResourceValidationRule[];
}

/**
 * A validation rule for a resource
 */
export interface ResourceValidationRule {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  category: 'naming' | 'configuration' | 'connection' | 'security' | 'performance';
  validate: (context: ValidationContext) => boolean;
}

/**
 * Context provided to validation rules
 */
export interface ValidationContext {
  resource: ResourceInstance;
  allResources: ResourceInstance[];
  connections: ConnectionInstance[];
  configuration: Record<string, unknown>;
}

/**
 * Represents an instance of a resource on the canvas
 */
export interface ResourceInstance {
  id: string;
  resourceType: string;
  instanceName: string;
  databaseName?: string;
  configuration: Record<string, unknown>;
}

/**
 * Represents a connection between resources
 */
export interface ConnectionInstance {
  id: string;
  sourceId: string;
  targetId: string;
  connectionType: 'reference' | 'waitFor' | 'dependsOn';
}

// ============================================================================
// C# Type Definitions
// ============================================================================

export const CSharpTypes: Record<string, CSharpType> = {
  string: {
    name: 'string',
    namespace: 'System',
    fullName: 'System.String',
  },
  int: {
    name: 'int',
    namespace: 'System',
    fullName: 'System.Int32',
  },
  bool: {
    name: 'bool',
    namespace: 'System',
    fullName: 'System.Boolean',
  },
  ContainerLifetime: {
    name: 'ContainerLifetime',
    namespace: 'Aspire.Hosting.ApplicationModel',
    fullName: 'Aspire.Hosting.ApplicationModel.ContainerLifetime',
  },
  IDistributedApplicationBuilder: {
    name: 'IDistributedApplicationBuilder',
    namespace: 'Aspire.Hosting',
    fullName: 'Aspire.Hosting.IDistributedApplicationBuilder',
  },
};

/**
 * Create a resource builder type for a specific resource
 */
export function createResourceBuilderType(resourceTypeName: string): CSharpType {
  return {
    name: `IResourceBuilder<${resourceTypeName}>`,
    namespace: 'Aspire.Hosting.ApplicationModel',
    fullName: `Aspire.Hosting.ApplicationModel.IResourceBuilder<${resourceTypeName}>`,
    genericParameters: [
      {
        name: resourceTypeName,
        namespace: 'Aspire.Hosting.ApplicationModel',
        fullName: `Aspire.Hosting.ApplicationModel.${resourceTypeName}`,
      },
    ],
  };
}

// ============================================================================
// Common Chaining Methods
// ============================================================================

export const commonChainingMethods: Record<string, ChainingMethod> = {
  WithReference: {
    name: 'WithReference',
    description: 'Adds a reference to another resource, making it available via dependency injection',
    parameters: [
      {
        name: 'resource',
        type: {
          name: 'IResourceBuilder<T>',
          namespace: 'Aspire.Hosting.ApplicationModel',
          fullName: 'Aspire.Hosting.ApplicationModel.IResourceBuilder<T>',
        },
        isRequired: true,
        description: 'The resource to reference',
      },
    ],
    returnType: createResourceBuilderType('T'),
    isExtensionMethod: true,
    extensionType: 'IResourceBuilder<T>',
    availableFor: ['project', 'container', 'compute'],
    canBeCalledMultipleTimes: true,
  },
  WaitFor: {
    name: 'WaitFor',
    description: 'Waits for the specified resource to be ready before starting this resource',
    parameters: [
      {
        name: 'resource',
        type: {
          name: 'IResourceBuilder<T>',
          namespace: 'Aspire.Hosting.ApplicationModel',
          fullName: 'Aspire.Hosting.ApplicationModel.IResourceBuilder<T>',
        },
        isRequired: true,
        description: 'The resource to wait for',
      },
    ],
    returnType: createResourceBuilderType('T'),
    isExtensionMethod: true,
    extensionType: 'IResourceBuilder<T>',
    availableFor: ['project', 'container', 'compute'],
    canBeCalledMultipleTimes: true,
  },
  WithLifetime: {
    name: 'WithLifetime',
    description: 'Sets the container lifetime for the resource',
    parameters: [
      {
        name: 'lifetime',
        type: CSharpTypes.ContainerLifetime,
        isRequired: true,
        description: 'The container lifetime',
        constraints: {
          allowedValues: ['Persistent', 'Session'],
        },
      },
    ],
    returnType: createResourceBuilderType('T'),
    isExtensionMethod: true,
    extensionType: 'IResourceBuilder<T>',
    availableFor: ['database', 'cache', 'messaging'],
    canBeCalledMultipleTimes: false,
  },
  WithEnvironment: {
    name: 'WithEnvironment',
    description: 'Adds an environment variable to the resource',
    parameters: [
      {
        name: 'name',
        type: CSharpTypes.string,
        isRequired: true,
        description: 'The environment variable name',
        constraints: {
          pattern: /^[A-Z_][A-Z0-9_]*$/,
        },
      },
      {
        name: 'value',
        type: CSharpTypes.string,
        isRequired: true,
        description: 'The environment variable value',
      },
    ],
    returnType: createResourceBuilderType('T'),
    isExtensionMethod: true,
    extensionType: 'IResourceBuilder<T>',
    availableFor: ['project', 'container', 'compute'],
    canBeCalledMultipleTimes: true,
  },
  WithHttpEndpoint: {
    name: 'WithHttpEndpoint',
    description: 'Exposes an HTTP endpoint for the resource',
    parameters: [
      {
        name: 'port',
        type: CSharpTypes.int,
        isRequired: false,
        description: 'The host port to expose',
        constraints: {
          minValue: 1,
          maxValue: 65535,
        },
      },
      {
        name: 'targetPort',
        type: CSharpTypes.int,
        isRequired: false,
        description: 'The container port to map to',
        constraints: {
          minValue: 1,
          maxValue: 65535,
        },
      },
      {
        name: 'name',
        type: CSharpTypes.string,
        isRequired: false,
        defaultValue: 'http',
        description: 'The endpoint name',
      },
      {
        name: 'env',
        type: CSharpTypes.string,
        isRequired: false,
        description: 'Environment variable for port injection',
      },
    ],
    returnType: createResourceBuilderType('T'),
    isExtensionMethod: true,
    extensionType: 'IResourceBuilder<T>',
    availableFor: ['project', 'container', 'compute'],
    canBeCalledMultipleTimes: true,
  },
  WithHttpsEndpoint: {
    name: 'WithHttpsEndpoint',
    description: 'Exposes an HTTPS endpoint for the resource',
    parameters: [
      {
        name: 'port',
        type: CSharpTypes.int,
        isRequired: false,
        description: 'The host port to expose',
        constraints: {
          minValue: 1,
          maxValue: 65535,
        },
      },
      {
        name: 'targetPort',
        type: CSharpTypes.int,
        isRequired: false,
        description: 'The container port to map to',
        constraints: {
          minValue: 1,
          maxValue: 65535,
        },
      },
      {
        name: 'name',
        type: CSharpTypes.string,
        isRequired: false,
        defaultValue: 'https',
        description: 'The endpoint name',
      },
    ],
    returnType: createResourceBuilderType('T'),
    isExtensionMethod: true,
    extensionType: 'IResourceBuilder<T>',
    availableFor: ['project', 'container', 'compute'],
    canBeCalledMultipleTimes: true,
  },
  WithBindMount: {
    name: 'WithBindMount',
    description: 'Adds a bind mount to the container',
    parameters: [
      {
        name: 'source',
        type: CSharpTypes.string,
        isRequired: true,
        description: 'The source path on the host',
        constraints: {
          mustBeValidPath: true,
        },
      },
      {
        name: 'target',
        type: CSharpTypes.string,
        isRequired: true,
        description: 'The target path in the container',
        constraints: {
          mustBeValidPath: true,
        },
      },
    ],
    returnType: createResourceBuilderType('T'),
    isExtensionMethod: true,
    extensionType: 'IResourceBuilder<T>',
    availableFor: ['container', 'database', 'cache', 'messaging'],
    canBeCalledMultipleTimes: true,
  },
  WithReplicas: {
    name: 'WithReplicas',
    description: 'Sets the number of replicas for the resource',
    parameters: [
      {
        name: 'count',
        type: CSharpTypes.int,
        isRequired: true,
        description: 'The number of replicas',
        constraints: {
          minValue: 1,
          maxValue: 100,
        },
      },
    ],
    returnType: createResourceBuilderType('T'),
    isExtensionMethod: true,
    extensionType: 'IResourceBuilder<T>',
    availableFor: ['project', 'container', 'compute'],
    canBeCalledMultipleTimes: false,
  },
};

// ============================================================================
// Resource API Definitions
// ============================================================================

export const resourceApiDefinitions: Record<string, ResourceApiDefinition> = {
  // ----- Databases -----
  postgres: {
    id: 'postgres',
    name: 'postgres',
    displayName: 'PostgreSQL',
    category: 'database',
    package: 'Aspire.Hosting.PostgreSQL',
    packageVersion: '13.0.0',
    builderMethod: {
      name: 'AddPostgres',
      description: 'Adds a PostgreSQL server resource to the application',
      parameters: [
        {
          name: 'name',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The name of the PostgreSQL server resource',
          constraints: {
            mustBeCSharpIdentifier: true,
            minLength: 1,
            maxLength: 63,
          },
        },
        {
          name: 'port',
          type: CSharpTypes.int,
          isRequired: false,
          defaultValue: 5432,
          description: 'The host port for the PostgreSQL server',
          constraints: {
            minValue: 1,
            maxValue: 65535,
          },
        },
      ],
      returnType: createResourceBuilderType('PostgresServerResource'),
      isExtensionMethod: true,
      extensionType: 'IDistributedApplicationBuilder',
    },
    childResourceMethods: [
      {
        name: 'AddDatabase',
        description: 'Adds a database to the PostgreSQL server',
        parameters: [
          {
            name: 'name',
            type: CSharpTypes.string,
            isRequired: true,
            description: 'The name of the database',
            constraints: {
              mustBeCSharpIdentifier: true,
              minLength: 1,
              maxLength: 63,
            },
          },
        ],
        returnType: createResourceBuilderType('PostgresDatabaseResource'),
        isExtensionMethod: true,
        extensionType: 'IResourceBuilder<PostgresServerResource>',
      },
    ],
    availableChainingMethods: ['WithLifetime', 'WithEnvironment', 'WithBindMount'],
    builderReturnType: createResourceBuilderType('PostgresServerResource'),
    connectionStringFormat: 'Host={host};Port={port};Database={database};Username={username};Password={password}',
    canBeReferencedBy: ['project', 'container', 'compute'],
    validationRules: [
      {
        id: 'postgres-database-name',
        severity: 'warning',
        message: 'Consider adding a database to the PostgreSQL server',
        category: 'configuration',
        validate: (ctx) => ctx.resource.databaseName !== undefined,
      },
    ],
  },

  sqlserver: {
    id: 'sqlserver',
    name: 'sqlserver',
    displayName: 'SQL Server',
    category: 'database',
    package: 'Aspire.Hosting.SqlServer',
    packageVersion: '13.0.0',
    builderMethod: {
      name: 'AddSqlServer',
      description: 'Adds a SQL Server resource to the application',
      parameters: [
        {
          name: 'name',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The name of the SQL Server resource',
          constraints: {
            mustBeCSharpIdentifier: true,
            minLength: 1,
            maxLength: 128,
          },
        },
        {
          name: 'port',
          type: CSharpTypes.int,
          isRequired: false,
          defaultValue: 1433,
          description: 'The host port for the SQL Server',
          constraints: {
            minValue: 1,
            maxValue: 65535,
          },
        },
      ],
      returnType: createResourceBuilderType('SqlServerServerResource'),
      isExtensionMethod: true,
      extensionType: 'IDistributedApplicationBuilder',
    },
    childResourceMethods: [
      {
        name: 'AddDatabase',
        description: 'Adds a database to the SQL Server',
        parameters: [
          {
            name: 'name',
            type: CSharpTypes.string,
            isRequired: true,
            description: 'The name of the database',
            constraints: {
              mustBeCSharpIdentifier: true,
              minLength: 1,
              maxLength: 128,
            },
          },
        ],
        returnType: createResourceBuilderType('SqlServerDatabaseResource'),
        isExtensionMethod: true,
        extensionType: 'IResourceBuilder<SqlServerServerResource>',
      },
    ],
    availableChainingMethods: ['WithLifetime', 'WithEnvironment', 'WithBindMount'],
    builderReturnType: createResourceBuilderType('SqlServerServerResource'),
    connectionStringFormat: 'Server={host},{port};Database={database};User Id={username};Password={password};TrustServerCertificate=True',
    canBeReferencedBy: ['project', 'container', 'compute'],
  },

  mongodb: {
    id: 'mongodb',
    name: 'mongodb',
    displayName: 'MongoDB',
    category: 'database',
    package: 'Aspire.Hosting.MongoDB',
    packageVersion: '13.0.0',
    builderMethod: {
      name: 'AddMongoDB',
      description: 'Adds a MongoDB server resource to the application',
      parameters: [
        {
          name: 'name',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The name of the MongoDB server resource',
          constraints: {
            mustBeCSharpIdentifier: true,
            minLength: 1,
            maxLength: 63,
          },
        },
        {
          name: 'port',
          type: CSharpTypes.int,
          isRequired: false,
          defaultValue: 27017,
          description: 'The host port for the MongoDB server',
          constraints: {
            minValue: 1,
            maxValue: 65535,
          },
        },
      ],
      returnType: createResourceBuilderType('MongoDBServerResource'),
      isExtensionMethod: true,
      extensionType: 'IDistributedApplicationBuilder',
    },
    childResourceMethods: [
      {
        name: 'AddDatabase',
        description: 'Adds a database to the MongoDB server',
        parameters: [
          {
            name: 'name',
            type: CSharpTypes.string,
            isRequired: true,
            description: 'The name of the database',
            constraints: {
              mustBeCSharpIdentifier: true,
              minLength: 1,
              maxLength: 63,
            },
          },
        ],
        returnType: createResourceBuilderType('MongoDBDatabaseResource'),
        isExtensionMethod: true,
        extensionType: 'IResourceBuilder<MongoDBServerResource>',
      },
    ],
    availableChainingMethods: ['WithLifetime', 'WithEnvironment', 'WithBindMount'],
    builderReturnType: createResourceBuilderType('MongoDBServerResource'),
    connectionStringFormat: 'mongodb://{username}:{password}@{host}:{port}',
    canBeReferencedBy: ['project', 'container', 'compute'],
  },

  mysql: {
    id: 'mysql',
    name: 'mysql',
    displayName: 'MySQL',
    category: 'database',
    package: 'Aspire.Hosting.MySql',
    packageVersion: '13.0.0',
    builderMethod: {
      name: 'AddMySql',
      description: 'Adds a MySQL server resource to the application',
      parameters: [
        {
          name: 'name',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The name of the MySQL server resource',
          constraints: {
            mustBeCSharpIdentifier: true,
            minLength: 1,
            maxLength: 64,
          },
        },
        {
          name: 'port',
          type: CSharpTypes.int,
          isRequired: false,
          defaultValue: 3306,
          description: 'The host port for the MySQL server',
          constraints: {
            minValue: 1,
            maxValue: 65535,
          },
        },
      ],
      returnType: createResourceBuilderType('MySqlServerResource'),
      isExtensionMethod: true,
      extensionType: 'IDistributedApplicationBuilder',
    },
    childResourceMethods: [
      {
        name: 'AddDatabase',
        description: 'Adds a database to the MySQL server',
        parameters: [
          {
            name: 'name',
            type: CSharpTypes.string,
            isRequired: true,
            description: 'The name of the database',
            constraints: {
              mustBeCSharpIdentifier: true,
              minLength: 1,
              maxLength: 64,
            },
          },
        ],
        returnType: createResourceBuilderType('MySqlDatabaseResource'),
        isExtensionMethod: true,
        extensionType: 'IResourceBuilder<MySqlServerResource>',
      },
    ],
    availableChainingMethods: ['WithLifetime', 'WithEnvironment', 'WithBindMount'],
    builderReturnType: createResourceBuilderType('MySqlServerResource'),
    connectionStringFormat: 'Server={host};Port={port};Database={database};User={username};Password={password}',
    canBeReferencedBy: ['project', 'container', 'compute'],
  },

  oracle: {
    id: 'oracle',
    name: 'oracle',
    displayName: 'Oracle Database',
    category: 'database',
    package: 'Aspire.Hosting.Oracle',
    packageVersion: '13.0.0',
    builderMethod: {
      name: 'AddOracle',
      description: 'Adds an Oracle Database server resource to the application',
      parameters: [
        {
          name: 'name',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The name of the Oracle Database server resource',
          constraints: {
            mustBeCSharpIdentifier: true,
            minLength: 1,
            maxLength: 128,
          },
        },
        {
          name: 'port',
          type: CSharpTypes.int,
          isRequired: false,
          defaultValue: 1521,
          description: 'The host port for the Oracle Database server',
          constraints: {
            minValue: 1,
            maxValue: 65535,
          },
        },
      ],
      returnType: createResourceBuilderType('OracleDatabaseServerResource'),
      isExtensionMethod: true,
      extensionType: 'IDistributedApplicationBuilder',
    },
    childResourceMethods: [
      {
        name: 'AddDatabase',
        description: 'Adds a database to the Oracle Database server',
        parameters: [
          {
            name: 'name',
            type: CSharpTypes.string,
            isRequired: true,
            description: 'The name of the database',
            constraints: {
              mustBeCSharpIdentifier: true,
              minLength: 1,
              maxLength: 128,
            },
          },
        ],
        returnType: createResourceBuilderType('OracleDatabaseResource'),
        isExtensionMethod: true,
        extensionType: 'IResourceBuilder<OracleDatabaseServerResource>',
      },
    ],
    availableChainingMethods: ['WithLifetime', 'WithEnvironment', 'WithBindMount'],
    builderReturnType: createResourceBuilderType('OracleDatabaseServerResource'),
    connectionStringFormat: 'Data Source={host}:{port}/{database};User Id={username};Password={password}',
    canBeReferencedBy: ['project', 'container', 'compute'],
  },

  // ----- Cache -----
  redis: {
    id: 'redis',
    name: 'redis',
    displayName: 'Redis',
    category: 'cache',
    package: 'Aspire.Hosting.Redis',
    packageVersion: '13.0.0',
    builderMethod: {
      name: 'AddRedis',
      description: 'Adds a Redis cache resource to the application',
      parameters: [
        {
          name: 'name',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The name of the Redis resource',
          constraints: {
            mustBeCSharpIdentifier: true,
            minLength: 1,
            maxLength: 63,
          },
        },
        {
          name: 'port',
          type: CSharpTypes.int,
          isRequired: false,
          defaultValue: 6379,
          description: 'The host port for the Redis server',
          constraints: {
            minValue: 1,
            maxValue: 65535,
          },
        },
      ],
      returnType: createResourceBuilderType('RedisResource'),
      isExtensionMethod: true,
      extensionType: 'IDistributedApplicationBuilder',
    },
    availableChainingMethods: ['WithLifetime', 'WithEnvironment', 'WithBindMount'],
    builderReturnType: createResourceBuilderType('RedisResource'),
    connectionStringFormat: '{host}:{port}',
    canBeReferencedBy: ['project', 'container', 'compute'],
  },

  valkey: {
    id: 'valkey',
    name: 'valkey',
    displayName: 'Valkey',
    category: 'cache',
    package: 'Aspire.Hosting.Valkey',
    packageVersion: '13.0.0',
    builderMethod: {
      name: 'AddValkey',
      description: 'Adds a Valkey cache resource to the application',
      parameters: [
        {
          name: 'name',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The name of the Valkey resource',
          constraints: {
            mustBeCSharpIdentifier: true,
            minLength: 1,
            maxLength: 63,
          },
        },
        {
          name: 'port',
          type: CSharpTypes.int,
          isRequired: false,
          defaultValue: 6379,
          description: 'The host port for the Valkey server',
          constraints: {
            minValue: 1,
            maxValue: 65535,
          },
        },
      ],
      returnType: createResourceBuilderType('ValkeyResource'),
      isExtensionMethod: true,
      extensionType: 'IDistributedApplicationBuilder',
    },
    availableChainingMethods: ['WithLifetime', 'WithEnvironment', 'WithBindMount'],
    builderReturnType: createResourceBuilderType('ValkeyResource'),
    connectionStringFormat: '{host}:{port}',
    canBeReferencedBy: ['project', 'container', 'compute'],
  },

  garnet: {
    id: 'garnet',
    name: 'garnet',
    displayName: 'Garnet',
    category: 'cache',
    package: 'Aspire.Hosting.Garnet',
    packageVersion: '13.0.0',
    builderMethod: {
      name: 'AddGarnet',
      description: 'Adds a Garnet cache resource to the application',
      parameters: [
        {
          name: 'name',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The name of the Garnet resource',
          constraints: {
            mustBeCSharpIdentifier: true,
            minLength: 1,
            maxLength: 63,
          },
        },
        {
          name: 'port',
          type: CSharpTypes.int,
          isRequired: false,
          defaultValue: 6379,
          description: 'The host port for the Garnet server',
          constraints: {
            minValue: 1,
            maxValue: 65535,
          },
        },
      ],
      returnType: createResourceBuilderType('GarnetResource'),
      isExtensionMethod: true,
      extensionType: 'IDistributedApplicationBuilder',
    },
    availableChainingMethods: ['WithLifetime', 'WithEnvironment', 'WithBindMount'],
    builderReturnType: createResourceBuilderType('GarnetResource'),
    connectionStringFormat: '{host}:{port}',
    canBeReferencedBy: ['project', 'container', 'compute'],
  },

  // ----- Messaging -----
  rabbitmq: {
    id: 'rabbitmq',
    name: 'rabbitmq',
    displayName: 'RabbitMQ',
    category: 'messaging',
    package: 'Aspire.Hosting.RabbitMQ',
    packageVersion: '13.0.0',
    builderMethod: {
      name: 'AddRabbitMQ',
      description: 'Adds a RabbitMQ message broker resource to the application',
      parameters: [
        {
          name: 'name',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The name of the RabbitMQ resource',
          constraints: {
            mustBeCSharpIdentifier: true,
            minLength: 1,
            maxLength: 63,
          },
        },
        {
          name: 'port',
          type: CSharpTypes.int,
          isRequired: false,
          defaultValue: 5672,
          description: 'The host port for the RabbitMQ server',
          constraints: {
            minValue: 1,
            maxValue: 65535,
          },
        },
      ],
      returnType: createResourceBuilderType('RabbitMQServerResource'),
      isExtensionMethod: true,
      extensionType: 'IDistributedApplicationBuilder',
    },
    availableChainingMethods: ['WithLifetime', 'WithEnvironment', 'WithBindMount', 'WithManagementPlugin'],
    builderReturnType: createResourceBuilderType('RabbitMQServerResource'),
    connectionStringFormat: 'amqp://{username}:{password}@{host}:{port}',
    canBeReferencedBy: ['project', 'container', 'compute'],
  },

  kafka: {
    id: 'kafka',
    name: 'kafka',
    displayName: 'Apache Kafka',
    category: 'messaging',
    package: 'Aspire.Hosting.Kafka',
    packageVersion: '13.0.0',
    builderMethod: {
      name: 'AddKafka',
      description: 'Adds an Apache Kafka message broker resource to the application',
      parameters: [
        {
          name: 'name',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The name of the Kafka resource',
          constraints: {
            mustBeCSharpIdentifier: true,
            minLength: 1,
            maxLength: 63,
          },
        },
        {
          name: 'port',
          type: CSharpTypes.int,
          isRequired: false,
          defaultValue: 9092,
          description: 'The host port for the Kafka server',
          constraints: {
            minValue: 1,
            maxValue: 65535,
          },
        },
      ],
      returnType: createResourceBuilderType('KafkaServerResource'),
      isExtensionMethod: true,
      extensionType: 'IDistributedApplicationBuilder',
    },
    availableChainingMethods: ['WithLifetime', 'WithEnvironment', 'WithBindMount', 'WithKafkaUI'],
    builderReturnType: createResourceBuilderType('KafkaServerResource'),
    connectionStringFormat: '{host}:{port}',
    canBeReferencedBy: ['project', 'container', 'compute'],
  },

  nats: {
    id: 'nats',
    name: 'nats',
    displayName: 'NATS',
    category: 'messaging',
    package: 'Aspire.Hosting.Nats',
    packageVersion: '13.0.0',
    builderMethod: {
      name: 'AddNats',
      description: 'Adds a NATS messaging resource to the application',
      parameters: [
        {
          name: 'name',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The name of the NATS resource',
          constraints: {
            mustBeCSharpIdentifier: true,
            minLength: 1,
            maxLength: 63,
          },
        },
        {
          name: 'port',
          type: CSharpTypes.int,
          isRequired: false,
          defaultValue: 4222,
          description: 'The host port for the NATS server',
          constraints: {
            minValue: 1,
            maxValue: 65535,
          },
        },
      ],
      returnType: createResourceBuilderType('NatsServerResource'),
      isExtensionMethod: true,
      extensionType: 'IDistributedApplicationBuilder',
    },
    availableChainingMethods: ['WithLifetime', 'WithEnvironment', 'WithBindMount', 'WithJetStream'],
    builderReturnType: createResourceBuilderType('NatsServerResource'),
    connectionStringFormat: 'nats://{host}:{port}',
    canBeReferencedBy: ['project', 'container', 'compute'],
  },

  // ----- AI -----
  openai: {
    id: 'openai',
    name: 'openai',
    displayName: 'OpenAI',
    category: 'ai',
    package: 'Aspire.Hosting',
    packageVersion: '13.0.0',
    builderMethod: {
      name: 'AddConnectionString',
      description: 'Adds a connection string for OpenAI API',
      parameters: [
        {
          name: 'name',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The name of the connection string resource',
          constraints: {
            mustBeCSharpIdentifier: true,
            minLength: 1,
            maxLength: 128,
          },
        },
      ],
      returnType: createResourceBuilderType('ConnectionStringResource'),
      isExtensionMethod: true,
      extensionType: 'IDistributedApplicationBuilder',
    },
    availableChainingMethods: [],
    builderReturnType: createResourceBuilderType('ConnectionStringResource'),
    canBeReferencedBy: ['project', 'container', 'compute'],
  },

  ollama: {
    id: 'ollama',
    name: 'ollama',
    displayName: 'Ollama',
    category: 'ai',
    package: 'Aspire.Hosting.Ollama',
    packageVersion: '13.0.0',
    builderMethod: {
      name: 'AddOllama',
      description: 'Adds an Ollama LLM server resource to the application',
      parameters: [
        {
          name: 'name',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The name of the Ollama resource',
          constraints: {
            mustBeCSharpIdentifier: true,
            minLength: 1,
            maxLength: 63,
          },
        },
        {
          name: 'port',
          type: CSharpTypes.int,
          isRequired: false,
          defaultValue: 11434,
          description: 'The host port for the Ollama server',
          constraints: {
            minValue: 1,
            maxValue: 65535,
          },
        },
      ],
      returnType: createResourceBuilderType('OllamaResource'),
      isExtensionMethod: true,
      extensionType: 'IDistributedApplicationBuilder',
    },
    childResourceMethods: [
      {
        name: 'AddModel',
        description: 'Adds a model to the Ollama server',
        parameters: [
          {
            name: 'name',
            type: CSharpTypes.string,
            isRequired: true,
            description: 'The name of the model',
          },
        ],
        returnType: createResourceBuilderType('OllamaModelResource'),
        isExtensionMethod: true,
        extensionType: 'IResourceBuilder<OllamaResource>',
      },
    ],
    availableChainingMethods: ['WithLifetime', 'WithEnvironment', 'WithBindMount'],
    builderReturnType: createResourceBuilderType('OllamaResource'),
    connectionStringFormat: 'http://{host}:{port}',
    canBeReferencedBy: ['project', 'container', 'compute'],
  },

  // ----- Projects -----
  'dotnet-project': {
    id: 'dotnet-project',
    name: 'dotnet-project',
    displayName: 'C# Project',
    category: 'project',
    package: 'Aspire.Hosting',
    packageVersion: '13.0.0',
    builderMethod: {
      name: 'AddProject',
      description: 'Adds a .NET project to the application',
      parameters: [
        {
          name: 'name',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The name of the project resource',
          constraints: {
            mustBeCSharpIdentifier: true,
            minLength: 1,
            maxLength: 128,
          },
        },
      ],
      returnType: createResourceBuilderType('ProjectResource'),
      isExtensionMethod: true,
      extensionType: 'IDistributedApplicationBuilder',
      genericConstraints: ['TProject : IProjectMetadata, new()'],
    },
    availableChainingMethods: ['WithReference', 'WaitFor', 'WithEnvironment', 'WithHttpEndpoint', 'WithHttpsEndpoint', 'WithReplicas'],
    builderReturnType: createResourceBuilderType('ProjectResource'),
    canConnectTo: ['database', 'cache', 'messaging', 'ai', 'project', 'container'],
  },

  'node-app': {
    id: 'node-app',
    name: 'node-app',
    displayName: 'Node.js App',
    category: 'project',
    package: 'Aspire.Hosting.NodeJs',
    packageVersion: '13.0.0',
    builderMethod: {
      name: 'AddNodeApp',
      description: 'Adds a Node.js application to the distributed application',
      parameters: [
        {
          name: 'name',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The name of the Node.js resource',
          constraints: {
            mustBeCSharpIdentifier: true,
            minLength: 1,
            maxLength: 128,
          },
        },
        {
          name: 'scriptPath',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The path to the Node.js project directory',
          constraints: {
            mustBeValidPath: true,
          },
        },
        {
          name: 'args',
          type: {
            name: 'string[]',
            namespace: 'System',
            fullName: 'System.String[]',
          },
          isRequired: false,
          description: 'Arguments to pass to npm',
        },
      ],
      returnType: createResourceBuilderType('NodeAppResource'),
      isExtensionMethod: true,
      extensionType: 'IDistributedApplicationBuilder',
    },
    availableChainingMethods: ['WithReference', 'WaitFor', 'WithEnvironment', 'WithHttpEndpoint', 'WithReplicas'],
    builderReturnType: createResourceBuilderType('NodeAppResource'),
    canConnectTo: ['database', 'cache', 'messaging', 'ai', 'project', 'container'],
  },

  'vite-app': {
    id: 'vite-app',
    name: 'vite-app',
    displayName: 'Vite App',
    category: 'project',
    package: 'Aspire.Hosting.NodeJs',
    packageVersion: '13.0.0',
    builderMethod: {
      name: 'AddViteApp',
      description: 'Adds a Vite-based frontend application',
      parameters: [
        {
          name: 'name',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The name of the Vite resource',
          constraints: {
            mustBeCSharpIdentifier: true,
            minLength: 1,
            maxLength: 128,
          },
        },
        {
          name: 'workingDirectory',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The path to the Vite project directory',
          constraints: {
            mustBeValidPath: true,
          },
        },
      ],
      returnType: createResourceBuilderType('ViteAppResource'),
      isExtensionMethod: true,
      extensionType: 'IDistributedApplicationBuilder',
    },
    availableChainingMethods: ['WithReference', 'WaitFor', 'WithEnvironment', 'WithHttpEndpoint', 'WithReplicas'],
    builderReturnType: createResourceBuilderType('ViteAppResource'),
    canConnectTo: ['project', 'ai', 'container'], // Vite apps typically connect to APIs, not databases directly
  },

  'python-app': {
    id: 'python-app',
    name: 'python-app',
    displayName: 'Python App',
    category: 'project',
    package: 'Aspire.Hosting.Python',
    packageVersion: '13.0.0',
    builderMethod: {
      name: 'AddPythonApp',
      description: 'Adds a Python application to the distributed application',
      parameters: [
        {
          name: 'name',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The name of the Python resource',
          constraints: {
            mustBeCSharpIdentifier: true,
            minLength: 1,
            maxLength: 128,
          },
        },
        {
          name: 'projectDirectory',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The path to the Python project directory',
          constraints: {
            mustBeValidPath: true,
          },
        },
        {
          name: 'scriptPath',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The name of the Python script to run',
          constraints: {
            pattern: /\.py$/,
          },
        },
      ],
      returnType: createResourceBuilderType('PythonAppResource'),
      isExtensionMethod: true,
      extensionType: 'IDistributedApplicationBuilder',
    },
    availableChainingMethods: ['WithReference', 'WaitFor', 'WithEnvironment', 'WithHttpEndpoint', 'WithReplicas'],
    builderReturnType: createResourceBuilderType('PythonAppResource'),
    canConnectTo: ['database', 'cache', 'messaging', 'ai', 'project', 'container'],
  },

  container: {
    id: 'container',
    name: 'container',
    displayName: 'Container',
    category: 'container',
    package: 'Aspire.Hosting',
    packageVersion: '13.0.0',
    builderMethod: {
      name: 'AddContainer',
      description: 'Adds a custom container to the distributed application',
      parameters: [
        {
          name: 'name',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The name of the container resource',
          constraints: {
            mustBeCSharpIdentifier: true,
            minLength: 1,
            maxLength: 128,
          },
        },
        {
          name: 'image',
          type: CSharpTypes.string,
          isRequired: true,
          description: 'The container image name',
          constraints: {
            pattern: /^[a-z0-9]+([\._\-\/][a-z0-9]+)*$/,
          },
        },
        {
          name: 'tag',
          type: CSharpTypes.string,
          isRequired: false,
          defaultValue: 'latest',
          description: 'The container image tag',
        },
      ],
      returnType: createResourceBuilderType('ContainerResource'),
      isExtensionMethod: true,
      extensionType: 'IDistributedApplicationBuilder',
    },
    availableChainingMethods: ['WithReference', 'WaitFor', 'WithEnvironment', 'WithHttpEndpoint', 'WithHttpsEndpoint', 'WithBindMount', 'WithReplicas'],
    builderReturnType: createResourceBuilderType('ContainerResource'),
    canConnectTo: ['database', 'cache', 'messaging', 'ai', 'project', 'container'],
  },
};

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates that a string is a valid C# identifier
 */
export function isValidCSharpIdentifier(name: string): boolean {
  // C# identifier rules:
  // - Must start with a letter or underscore
  // - Can contain letters, digits, and underscores
  // - Cannot be a reserved keyword
  const identifierPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  
  const reservedKeywords = new Set([
    'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked',
    'class', 'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else',
    'enum', 'event', 'explicit', 'extern', 'false', 'finally', 'fixed', 'float', 'for',
    'foreach', 'goto', 'if', 'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock',
    'long', 'namespace', 'new', 'null', 'object', 'operator', 'out', 'override', 'params',
    'private', 'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed', 'short',
    'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw', 'true',
    'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort', 'using', 'virtual',
    'void', 'volatile', 'while',
  ]);

  if (!identifierPattern.test(name)) {
    return false;
  }

  return !reservedKeywords.has(name);
}

/**
 * Validates a parameter value against its constraints
 */
export function validateParameterValue(
  value: unknown,
  parameter: MethodParameter
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const constraints = parameter.constraints;

  if (parameter.isRequired && (value === undefined || value === null || value === '')) {
    errors.push(`${parameter.name} is required`);
    return { isValid: false, errors };
  }

  if (value === undefined || value === null) {
    return { isValid: true, errors: [] };
  }

  if (constraints) {
    if (typeof value === 'string') {
      if (constraints.minLength !== undefined && value.length < constraints.minLength) {
        errors.push(`${parameter.name} must be at least ${constraints.minLength} characters`);
      }
      if (constraints.maxLength !== undefined && value.length > constraints.maxLength) {
        errors.push(`${parameter.name} must be at most ${constraints.maxLength} characters`);
      }
      if (constraints.pattern && !constraints.pattern.test(value)) {
        errors.push(`${parameter.name} has an invalid format`);
      }
      if (constraints.mustBeCSharpIdentifier && !isValidCSharpIdentifier(value)) {
        errors.push(`${parameter.name} must be a valid C# identifier`);
      }
    }

    if (typeof value === 'number') {
      if (constraints.minValue !== undefined && value < constraints.minValue) {
        errors.push(`${parameter.name} must be at least ${constraints.minValue}`);
      }
      if (constraints.maxValue !== undefined && value > constraints.maxValue) {
        errors.push(`${parameter.name} must be at most ${constraints.maxValue}`);
      }
    }

    if (constraints.allowedValues && !constraints.allowedValues.includes(value as string | number)) {
      errors.push(`${parameter.name} must be one of: ${constraints.allowedValues.join(', ')}`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Gets the API definition for a resource type
 */
export function getResourceApiDefinition(resourceType: string): ResourceApiDefinition | undefined {
  return resourceApiDefinitions[resourceType];
}

/**
 * Gets available chaining methods for a resource
 */
export function getAvailableChainingMethods(resourceType: string): ChainingMethod[] {
  const definition = getResourceApiDefinition(resourceType);
  if (!definition) return [];

  return definition.availableChainingMethods
    .map(name => commonChainingMethods[name])
    .filter(Boolean);
}

/**
 * Checks if a connection is valid between two resource types
 */
export function isValidConnection(sourceType: string, targetType: string): boolean {
  const sourceDefinition = getResourceApiDefinition(sourceType);
  const targetDefinition = getResourceApiDefinition(targetType);

  if (!sourceDefinition || !targetDefinition) {
    return false;
  }

  // Source can be referenced by target
  if (sourceDefinition.canBeReferencedBy?.includes(targetDefinition.category)) {
    return true;
  }

  // Target can connect to source's category
  if (targetDefinition.canConnectTo?.includes(sourceDefinition.category)) {
    return true;
  }

  return false;
}

/**
 * Gets required NuGet packages for a set of resources
 */
export function getRequiredPackages(resourceTypes: string[]): string[] {
  const packages = new Set<string>();

  for (const type of resourceTypes) {
    const definition = getResourceApiDefinition(type);
    if (definition && definition.package !== 'Aspire.Hosting') {
      packages.add(`${definition.package}@${definition.packageVersion}`);
    }
  }

  return Array.from(packages).sort();
}
