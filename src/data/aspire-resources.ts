/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from Aspire NuGet packages via api-ripper
 * Generation date: 2025-11-25
 * Aspire SDK version: 13.0.0
 * 
 * To regenerate: npm run generate-resources
 * 
 * This file combines:
 * - Technical API data from Aspire NuGet packages (via api-ripper)
 * - Human-readable descriptions from aspire.dev documentation
 */

// Import icons
import postgresIcon from '../assets/icons/postgresql-icon.png';
import sqlServerIcon from '../assets/icons/sql-icon.png';
import mongodbIcon from '../assets/icons/mongodb-icon.png';
import mysqlIcon from '../assets/icons/mysqlconnector-icon.png';
import oracleIcon from '../assets/icons/oracle-icon.svg';
import redisIcon from '../assets/icons/redis-icon.png';
import valkeyIcon from '../assets/icons/valkey-icon.png';
import garnetIcon from '../assets/icons/garnet-icon.png';
import rabbitmqIcon from '../assets/icons/rabbitmq-icon.svg';
import kafkaIcon from '../assets/icons/apache-kafka-icon.svg';
import natsIcon from '../assets/icons/nats-icon.png';
import openaiIcon from '../assets/icons/openai-icon.png';
import ollamaIcon from '../assets/icons/ollama-icon.png';
import nodejsIcon from '../assets/icons/nodejs-icon.png';
import pythonIcon from '../assets/icons/python.svg';
import reactIcon from '../assets/icons/react-icon.svg';
import dockerIcon from '../assets/icons/docker.svg';
import csharpIcon from '../assets/icons/csharp.svg';

export interface AspireResource {
  id: string;
  name: string;
  displayName: string;
  category: 'database' | 'cache' | 'messaging' | 'ai' | 'compute' | 'project';
  icon: string;
  color: string;
  description: string;
  package: string;
  hostingMethod: string;
  languages: string[];
  connectionMethod?: string;
  allowsDatabase?: boolean;
  exampleCode: string;
  nugetPackage?: string;
}

export const aspireResources: AspireResource[] = [
  // Projects
  {
    id: 'dotnet-project',
    name: 'dotnet-project',
    displayName: 'C# Project',
    category: 'project',
    icon: csharpIcon,
    color: '#512BD4',
    description: 'ASP.NET Core API, Web App, or Worker Service',
    package: 'Aspire.Hosting',
    hostingMethod: 'AddProject',
    languages: ['C#'],
    exampleCode: 'builder.AddProject<Projects.ApiService>("api")',
  },
  {
    id: 'node-app',
    name: 'node-app',
    displayName: 'Node.js App',
    category: 'project',
    icon: nodejsIcon,
    color: '#68A063',
    description: 'Node.js/Vite application with npm/yarn/pnpm support',
    package: 'Aspire.Hosting.NodeJs',
    hostingMethod: 'AddNodeApp',
    languages: ['JavaScript', 'TypeScript'],
    exampleCode: 'builder.AddNodeApp("frontend", "../frontend")',
    nugetPackage: 'Aspire.Hosting.NodeJs@13.0.0',
  },
  {
    id: 'vite-app',
    name: 'vite-app',
    displayName: 'Vite App',
    category: 'project',
    icon: reactIcon,
    color: '#646CFF',
    description: 'Vite-powered React, Vue, or Svelte application',
    package: 'Aspire.Hosting.NodeJs',
    hostingMethod: 'AddViteApp',
    languages: ['JavaScript', 'TypeScript'],
    exampleCode: 'builder.AddViteApp("frontend", "../frontend")\\n    .WithHttpEndpoint(env: "PORT")',
    nugetPackage: 'Aspire.Hosting.NodeJs@13.0.0',
  },
  {
    id: 'python-app',
    name: 'python-app',
    displayName: 'Python App',
    category: 'project',
    icon: pythonIcon,
    color: '#3776AB',
    description: 'Python application with uv, pip, or venv support',
    package: 'Aspire.Hosting.Python',
    hostingMethod: 'AddPythonApp',
    languages: ['Python'],
    exampleCode: 'builder.AddPythonApp("worker", "../worker", "main.py")',
    nugetPackage: 'Aspire.Hosting.Python@13.0.0',
  },
  {
    id: 'container',
    name: 'container',
    displayName: 'Container',
    category: 'compute',
    icon: dockerIcon,
    color: '#2496ED',
    description: 'Custom Docker container image',
    package: 'Aspire.Hosting',
    hostingMethod: 'AddContainer',
    languages: ['Any'],
    exampleCode: 'builder.AddContainer("myapp", "myregistry/myapp", "latest")\\n    .WithHttpEndpoint(targetPort: 8080)',
  },

  // Databases
  {
    id: 'postgres',
    name: 'postgres',
    displayName: 'PostgreSQL',
    category: 'database',
    icon: postgresIcon,
    color: '#336791',
    description: 'PostgreSQL database server',
    package: 'Aspire.Hosting.PostgreSQL',
    hostingMethod: 'AddPostgres',
    languages: ['C#', 'Python', 'JavaScript', 'Go', 'Java'],
    allowsDatabase: true,
    connectionMethod: 'AddDatabase',
    exampleCode: 'var postgres = builder.AddPostgres("postgres");\\nvar db = postgres.AddDatabase("mydb");',
    nugetPackage: 'Aspire.Hosting.PostgreSQL@13.0.0',
  },
  {
    id: 'sqlserver',
    name: 'sqlserver',
    displayName: 'SQL Server',
    category: 'database',
    icon: sqlServerIcon,
    color: '#CC2927',
    description: 'Microsoft SQL Server database',
    package: 'Aspire.Hosting.SqlServer',
    hostingMethod: 'AddSqlServer',
    languages: ['C#', 'Python', 'JavaScript', 'Java'],
    allowsDatabase: true,
    connectionMethod: 'AddDatabase',
    exampleCode: 'var sql = builder.AddSqlServer("sql");\\nvar db = sql.AddDatabase("mydb");',
    nugetPackage: 'Aspire.Hosting.SqlServer@13.0.0',
  },
  {
    id: 'mongodb',
    name: 'mongodb',
    displayName: 'MongoDB',
    category: 'database',
    icon: mongodbIcon,
    color: '#47A248',
    description: 'MongoDB NoSQL database',
    package: 'Aspire.Hosting.MongoDB',
    hostingMethod: 'AddMongoDB',
    languages: ['C#', 'Python', 'JavaScript', 'Go', 'Java'],
    allowsDatabase: true,
    connectionMethod: 'AddDatabase',
    exampleCode: 'var mongo = builder.AddMongoDB("mongo");\\nvar db = mongo.AddDatabase("mydb");',
    nugetPackage: 'Aspire.Hosting.MongoDB@13.0.0',
  },
  {
    id: 'mysql',
    name: 'mysql',
    displayName: 'MySQL',
    category: 'database',
    icon: mysqlIcon,
    color: '#4479A1',
    description: 'MySQL database server',
    package: 'Aspire.Hosting.MySql',
    hostingMethod: 'AddMySql',
    languages: ['C#', 'Python', 'JavaScript', 'Go', 'Java'],
    allowsDatabase: true,
    connectionMethod: 'AddDatabase',
    exampleCode: 'var mysql = builder.AddMySql("mysql");\\nvar db = mysql.AddDatabase("mydb");',
    nugetPackage: 'Aspire.Hosting.MySql@13.0.0',
  },
  {
    id: 'oracle',
    name: 'oracle',
    displayName: 'Oracle Database',
    category: 'database',
    icon: oracleIcon,
    color: '#F80000',
    description: 'Oracle Database server',
    package: 'Aspire.Hosting.Oracle',
    hostingMethod: 'AddOracle',
    languages: ['C#', 'Java'],
    allowsDatabase: true,
    connectionMethod: 'AddDatabase',
    exampleCode: 'var oracle = builder.AddOracle("oracle");\\nvar db = oracle.AddDatabase("mydb");',
    nugetPackage: 'Aspire.Hosting.Oracle@13.0.0',
  },

  // Cache
  {
    id: 'redis',
    name: 'redis',
    displayName: 'Redis',
    category: 'cache',
    icon: redisIcon,
    color: '#DC382D',
    description: 'Redis cache and pub/sub',
    package: 'Aspire.Hosting.Redis',
    hostingMethod: 'AddRedis',
    languages: ['C#', 'Python', 'JavaScript', 'Go', 'Java'],
    exampleCode: 'var cache = builder.AddRedis("cache");',
    nugetPackage: 'Aspire.Hosting.Redis@13.0.0',
  },
  {
    id: 'valkey',
    name: 'valkey',
    displayName: 'Valkey',
    category: 'cache',
    icon: valkeyIcon,
    color: '#FF6B35',
    description: 'Valkey cache (Redis fork)',
    package: 'Aspire.Hosting.Valkey',
    hostingMethod: 'AddValkey',
    languages: ['C#', 'Python', 'JavaScript', 'Go', 'Java'],
    exampleCode: 'var cache = builder.AddValkey("cache");',
    nugetPackage: 'Aspire.Hosting.Valkey@13.0.0',
  },
  {
    id: 'garnet',
    name: 'garnet',
    displayName: 'Garnet',
    category: 'cache',
    icon: garnetIcon,
    color: '#AA336A',
    description: 'Microsoft Garnet cache server',
    package: 'Aspire.Hosting.Garnet',
    hostingMethod: 'AddGarnet',
    languages: ['C#', 'Python', 'JavaScript'],
    exampleCode: 'var cache = builder.AddGarnet("cache");',
    nugetPackage: 'Aspire.Hosting.Garnet@13.0.0',
  },

  // Messaging
  {
    id: 'rabbitmq',
    name: 'rabbitmq',
    displayName: 'RabbitMQ',
    category: 'messaging',
    icon: rabbitmqIcon,
    color: '#FF6600',
    description: 'RabbitMQ message broker',
    package: 'Aspire.Hosting.RabbitMQ',
    hostingMethod: 'AddRabbitMQ',
    languages: ['C#', 'Python', 'JavaScript', 'Go', 'Java'],
    exampleCode: 'var messaging = builder.AddRabbitMQ("messaging");',
    nugetPackage: 'Aspire.Hosting.RabbitMQ@13.0.0',
  },
  {
    id: 'kafka',
    name: 'kafka',
    displayName: 'Apache Kafka',
    category: 'messaging',
    icon: kafkaIcon,
    color: '#231F20',
    description: 'Apache Kafka event streaming',
    package: 'Aspire.Hosting.Kafka',
    hostingMethod: 'AddKafka',
    languages: ['C#', 'Python', 'JavaScript', 'Go', 'Java'],
    exampleCode: 'var kafka = builder.AddKafka("kafka");',
    nugetPackage: 'Aspire.Hosting.Kafka@13.0.0',
  },
  {
    id: 'nats',
    name: 'nats',
    displayName: 'NATS',
    category: 'messaging',
    icon: natsIcon,
    color: '#27AAE1',
    description: 'NATS messaging system',
    package: 'Aspire.Hosting.Nats',
    hostingMethod: 'AddNats',
    languages: ['C#', 'Python', 'JavaScript', 'Go'],
    exampleCode: 'var messaging = builder.AddNats("nats");',
    nugetPackage: 'Aspire.Hosting.Nats@13.0.0',
  },

  // AI
  {
    id: 'openai',
    name: 'openai',
    displayName: 'OpenAI',
    category: 'ai',
    icon: openaiIcon,
    color: '#10A37F',
    description: 'OpenAI API integration',
    package: 'Aspire.Hosting.Azure',
    hostingMethod: 'AddConnectionString',
    languages: ['C#', 'Python', 'JavaScript'],
    exampleCode: 'var openai = builder.AddConnectionString("openai");',
    nugetPackage: 'Aspire.Azure.AI.OpenAI@13.0.0',
  },
  {
    id: 'ollama',
    name: 'ollama',
    displayName: 'Ollama',
    category: 'ai',
    icon: ollamaIcon,
    color: '#000000',
    description: 'Local LLM with Ollama',
    package: 'Aspire.Hosting.Ollama',
    hostingMethod: 'AddOllama',
    languages: ['C#', 'Python', 'JavaScript'],
    exampleCode: 'var ollama = builder.AddOllama("ollama");',
    nugetPackage: 'Aspire.Hosting.Ollama@13.0.0',
  },
];

export const resourceCategories = [
  { id: 'project', name: 'Apps', icon: '💻', color: '#0078D4' },
  { id: 'database', name: 'Databases', icon: '🗄️', color: '#107C10' },
  { id: 'cache', name: 'Caching', icon: '⚡', color: '#FFB900' },
  { id: 'messaging', name: 'Messaging', icon: '📬', color: '#E74856' },
  { id: 'ai', name: 'AI', icon: '🧠', color: '#00BCF2' },
  { id: 'compute', name: 'Compute', icon: '🔧', color: '#8764B8' },
];
