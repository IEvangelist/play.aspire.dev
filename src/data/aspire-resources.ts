/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from Aspire NuGet packages via api-ripper
 * Generation date: 2026-01-29T20:10:57.876Z
 * Aspire SDK version: 13.1.0
 * 
 * To regenerate: npm run generate-resources
 * 
 * This file combines:
 * - Technical API data from Aspire NuGet packages (via api-ripper)
 * - Human-readable descriptions from aspire.dev documentation
 */

// Import icons
import csharpIcon from '../assets/icons/csharp.svg';
import nodejsIcon from '../assets/icons/nodejs-icon.png';
import pythonIcon from '../assets/icons/python.svg';
import reactIcon from '../assets/icons/react-icon.svg';
import mongodbIcon from '../assets/icons/mongodb-icon.png';
import mysqlIcon from '../assets/icons/mysqlconnector-icon.png';
import oracleIcon from '../assets/icons/oracle-icon.svg';
import postgresIcon from '../assets/icons/postgresql-icon.png';
import sqlServerIcon from '../assets/icons/sql-icon.png';
import garnetIcon from '../assets/icons/garnet-icon.png';
import redisIcon from '../assets/icons/redis-icon.png';
import valkeyIcon from '../assets/icons/valkey-icon.png';
import kafkaIcon from '../assets/icons/apache-kafka-icon.svg';
import natsIcon from '../assets/icons/nats-icon.png';
import rabbitmqIcon from '../assets/icons/rabbitmq-icon.svg';
import ollamaIcon from '../assets/icons/ollama-icon.png';
import openaiIcon from '../assets/icons/openai-icon.png';
import dockerIcon from '../assets/icons/docker.svg';

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
  {
    "id": "dotnet-project",
    "name": "dotnet-project",
    "displayName": "C# Project",
    "category": "project",
    "color": "#512BD4",
    "description": "ASP.NET Core API, Web App, or Worker Service",
    "package": "Aspire.Hosting",
    "hostingMethod": "AddProject",
    "languages": [
      "C#"
    ],
    "exampleCode": "builder.AddProject<Projects.ApiService>(\"api\")",
    "icon": csharpIcon
  },
  {
<<<<<<< Updated upstream
    id: 'node-app',
    name: 'node-app',
    displayName: 'Node.js App',
    category: 'project',
    icon: nodejsIcon,
    color: '#68A063',
    description: 'Node.js/Vite application with npm/yarn/pnpm support',
    package: 'Aspire.Hosting.JavaScript',
    hostingMethod: 'AddNodeApp',
    languages: ['JavaScript', 'TypeScript'],
    exampleCode: 'builder.AddNodeApp("frontend", "../frontend")',
    nugetPackage: 'Aspire.Hosting.JavaScript@13.0.0',
  },
  {
    id: 'vite-app',
    name: 'vite-app',
    displayName: 'Vite App',
    category: 'project',
    icon: reactIcon,
    color: '#646CFF',
    description: 'Vite-powered React, Vue, or Svelte application',
    package: 'Aspire.Hosting.JavaScript',
    hostingMethod: 'AddViteApp',
    languages: ['JavaScript', 'TypeScript'],
    exampleCode: 'builder.AddViteApp("frontend", "../frontend")\\n    .WithHttpEndpoint(env: "PORT")',
    nugetPackage: 'Aspire.Hosting.JavaScript@13.0.0',
=======
    "id": "nodeapp",
    "name": "nodeapp",
    "displayName": "Node.js App",
    "category": "project",
    "color": "#68A063",
    "description": "Adds a node application to the application model. Node should be available on the PATH.",
    "package": "Aspire.Hosting.JavaScript",
    "hostingMethod": "AddNodeApp",
    "languages": [
      "JavaScript",
      "TypeScript"
    ],
    "allowsDatabase": false,
    "exampleCode": "var nodeapp = builder.AddNodeApp(\"nodeapp\");",
    "nugetPackage": "Aspire.Hosting.JavaScript@13.1.0",
    "icon": nodejsIcon
  },
  {
    "id": "pythonapp",
    "name": "pythonapp",
    "displayName": "Python App",
    "category": "project",
    "color": "#3776AB",
    "description": "Adds a Python application to the application model.",
    "package": "Aspire.Hosting.Python",
    "hostingMethod": "AddPythonApp",
    "languages": [
      "Python"
    ],
    "allowsDatabase": false,
    "exampleCode": "var pythonapp = builder.AddPythonApp(\"pythonapp\");",
    "nugetPackage": "Aspire.Hosting.Python@13.1.0",
    "icon": pythonIcon
>>>>>>> Stashed changes
  },
  {
    "id": "viteapp",
    "name": "viteapp",
    "displayName": "Vite App",
    "category": "project",
    "color": "#646CFF",
    "description": "Adds a Vite app to the distributed application builder.",
    "package": "Aspire.Hosting.JavaScript",
    "hostingMethod": "AddViteApp",
    "languages": [
      "JavaScript",
      "TypeScript"
    ],
    "allowsDatabase": false,
    "exampleCode": "var viteapp = builder.AddViteApp(\"viteapp\");",
    "nugetPackage": "Aspire.Hosting.JavaScript@13.1.0",
    "icon": reactIcon
  },
  {
    "id": "mongodb",
    "name": "mongodb",
    "displayName": "MongoDB",
    "category": "database",
    "color": "#47A248",
    "description": "Adds a MongoDB resource to the application model. A container is used for local development.",
    "package": "Aspire.Hosting.MongoDB",
    "hostingMethod": "AddMongoDB",
    "languages": [
      "C#",
      "Python",
      "JavaScript",
      "Go",
      "Java"
    ],
    "allowsDatabase": true,
    "connectionMethod": "AddDatabase",
    "exampleCode": "var mongodb = builder.AddMongoDB(\"mongodb\");",
    "nugetPackage": "Aspire.Hosting.MongoDB@13.1.0",
    "icon": mongodbIcon
  },
  {
    "id": "mysql",
    "name": "mysql",
    "displayName": "MySQL",
    "category": "database",
    "color": "#4479A1",
    "description": "Adds a MySQL server resource to the application model. For local development a container is used.",
    "package": "Aspire.Hosting.MySql",
    "hostingMethod": "AddMySql",
    "languages": [
      "C#",
      "Python",
      "JavaScript",
      "Go",
      "Java"
    ],
    "allowsDatabase": true,
    "connectionMethod": "AddDatabase",
    "exampleCode": "var mysql = builder.AddMySql(\"mysql\");",
    "nugetPackage": "Aspire.Hosting.MySql@13.1.0",
    "icon": mysqlIcon
  },
  {
    "id": "oracle",
    "name": "oracle",
    "displayName": "Oracle Database",
    "category": "database",
    "color": "#F80000",
    "description": "Adds a Oracle Server resource to the application model. A container is used for local development.",
    "package": "Aspire.Hosting.Oracle",
    "hostingMethod": "AddOracle",
    "languages": [
      "C#",
      "Java"
    ],
    "allowsDatabase": true,
    "connectionMethod": "AddDatabase",
    "exampleCode": "var oracle = builder.AddOracle(\"oracle\");",
    "nugetPackage": "Aspire.Hosting.Oracle@13.1.0",
    "icon": oracleIcon
  },
  {
    "id": "postgres",
    "name": "postgres",
    "displayName": "PostgreSQL",
    "category": "database",
    "color": "#336791",
    "description": "Adds a PostgreSQL resource to the application model. A container is used for local development.",
    "package": "Aspire.Hosting.PostgreSQL",
    "hostingMethod": "AddPostgres",
    "languages": [
      "C#",
      "Python",
      "JavaScript",
      "Go",
      "Java"
    ],
    "allowsDatabase": true,
    "connectionMethod": "AddDatabase",
    "exampleCode": "var postgres = builder.AddPostgres(\"postgres\");",
    "nugetPackage": "Aspire.Hosting.PostgreSQL@13.1.0",
    "icon": postgresIcon
  },
  {
    "id": "sqlserver",
    "name": "sqlserver",
    "displayName": "SQL Server",
    "category": "database",
    "color": "#CC2927",
    "description": "Adds a SQL Server resource to the application model. A container is used for local development.",
    "package": "Aspire.Hosting.SqlServer",
    "hostingMethod": "AddSqlServer",
    "languages": [
      "C#",
      "Python",
      "JavaScript",
      "Java"
    ],
    "allowsDatabase": true,
    "connectionMethod": "AddDatabase",
    "exampleCode": "var sqlserver = builder.AddSqlServer(\"sqlserver\");",
    "nugetPackage": "Aspire.Hosting.SqlServer@13.1.0",
    "icon": sqlServerIcon
  },
  {
    "id": "garnet",
    "name": "garnet",
    "displayName": "Garnet",
    "category": "cache",
    "color": "#AA336A",
    "description": "Adds a Garnet container to the application model.",
    "package": "Aspire.Hosting.Garnet",
    "hostingMethod": "AddGarnet",
    "languages": [
      "C#",
      "Python",
      "JavaScript"
    ],
    "allowsDatabase": false,
    "exampleCode": "var garnet = builder.AddGarnet(\"garnet\");",
    "nugetPackage": "Aspire.Hosting.Garnet@13.1.0",
    "icon": garnetIcon
  },
  {
    "id": "redis",
    "name": "redis",
    "displayName": "Redis",
    "category": "cache",
    "color": "#DC382D",
    "description": "Adds a Redis container to the application model.",
    "package": "Aspire.Hosting.Redis",
    "hostingMethod": "AddRedis",
    "languages": [
      "C#",
      "Python",
      "JavaScript",
      "Go",
      "Java"
    ],
    "allowsDatabase": false,
    "exampleCode": "var redis = builder.AddRedis(\"redis\");",
    "nugetPackage": "Aspire.Hosting.Redis@13.1.0",
    "icon": redisIcon
  },
  {
    "id": "valkey",
    "name": "valkey",
    "displayName": "Valkey",
    "category": "cache",
    "color": "#FF6B35",
    "description": "Adds a Valkey container to the application model.",
    "package": "Aspire.Hosting.Valkey",
    "hostingMethod": "AddValkey",
    "languages": [
      "C#",
      "Python",
      "JavaScript",
      "Go",
      "Java"
    ],
    "allowsDatabase": false,
    "exampleCode": "var valkey = builder.AddValkey(\"valkey\");",
    "nugetPackage": "Aspire.Hosting.Valkey@13.1.0",
    "icon": valkeyIcon
  },
  {
    "id": "kafka",
    "name": "kafka",
    "displayName": "Apache Kafka",
    "category": "messaging",
    "color": "#231F20",
    "description": "Adds a Kafka resource to the application. A container is used for local development.",
    "package": "Aspire.Hosting.Kafka",
    "hostingMethod": "AddKafka",
    "languages": [
      "C#",
      "Python",
      "JavaScript",
      "Go",
      "Java"
    ],
    "allowsDatabase": false,
    "exampleCode": "var kafka = builder.AddKafka(\"kafka\");",
    "nugetPackage": "Aspire.Hosting.Kafka@13.1.0",
    "icon": kafkaIcon
  },
  {
    "id": "nats",
    "name": "nats",
    "displayName": "NATS",
    "category": "messaging",
    "color": "#27AAE1",
    "description": "Adds a NATS server resource to the application model. A container is used for local development. This configures a default user name and password for the NATS server.",
    "package": "Aspire.Hosting.Nats",
    "hostingMethod": "AddNats",
    "languages": [
      "C#",
      "Python",
      "JavaScript",
      "Go"
    ],
    "allowsDatabase": false,
    "exampleCode": "var nats = builder.AddNats(\"nats\");",
    "nugetPackage": "Aspire.Hosting.Nats@13.1.0",
    "icon": natsIcon
  },
  {
    "id": "rabbitmq",
    "name": "rabbitmq",
    "displayName": "RabbitMQ",
    "category": "messaging",
    "color": "#FF6600",
    "description": "Adds a RabbitMQ container to the application model.",
    "package": "Aspire.Hosting.RabbitMQ",
    "hostingMethod": "AddRabbitMQ",
    "languages": [
      "C#",
      "Python",
      "JavaScript",
      "Go",
      "Java"
    ],
    "allowsDatabase": false,
    "exampleCode": "var rabbitmq = builder.AddRabbitMQ(\"rabbitmq\");",
    "nugetPackage": "Aspire.Hosting.RabbitMQ@13.1.0",
    "icon": rabbitmqIcon
  },
  {
    "id": "ollama",
    "name": "ollama",
    "displayName": "Ollama",
    "category": "ai",
    "color": "#000000",
    "description": "Adds an Ollama container resource to the application model.",
    "package": "CommunityToolkit.Aspire.Hosting.Ollama",
    "hostingMethod": "AddOllama",
    "languages": [
      "C#",
      "Python",
      "JavaScript"
    ],
    "allowsDatabase": false,
    "exampleCode": "var ollama = builder.AddOllama(\"ollama\");",
    "nugetPackage": "CommunityToolkit.Aspire.Hosting.Ollama@13.1.1",
    "icon": ollamaIcon
  },
  {
    "id": "openai",
    "name": "openai",
    "displayName": "OpenAI",
    "category": "ai",
    "color": "#10A37F",
    "description": "OpenAI API integration",
    "package": "Aspire.Hosting.Azure",
    "hostingMethod": "AddConnectionString",
    "languages": [
      "C#",
      "Python",
      "JavaScript"
    ],
    "exampleCode": "var openai = builder.AddConnectionString(\"openai\");",
    "nugetPackage": "Aspire.Azure.AI.OpenAI",
    "icon": openaiIcon
  },
  {
    "id": "container",
    "name": "container",
    "displayName": "Container",
    "category": "compute",
    "color": "#2496ED",
    "description": "Custom Docker container image",
    "package": "Aspire.Hosting",
    "hostingMethod": "AddContainer",
    "languages": [
      "Any"
    ],
    "exampleCode": "builder.AddContainer(\"myapp\", \"myregistry/myapp\", \"latest\")\\n    .WithHttpEndpoint(targetPort: 8080)",
    "icon": dockerIcon
  }
];

export const resourceCategories = [
  { id: 'project', name: 'Apps', icon: '💻', color: '#0078D4' },
  { id: 'database', name: 'Databases', icon: '🗄️', color: '#107C10' },
  { id: 'cache', name: 'Caching', icon: '⚡', color: '#FFB900' },
  { id: 'messaging', name: 'Messaging', icon: '📬', color: '#E74856' },
  { id: 'ai', name: 'AI', icon: '🧠', color: '#00BCF2' },
  { id: 'compute', name: 'Compute', icon: '🔧', color: '#8764B8' },
];
