import type { Node, Edge } from '@xyflow/react';
import type { AspireNodeData } from '../components/playground/AspireNode';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'starter' | 'microservices' | 'data' | 'ai' | 'fullstack';
  icon: string;
  nodes: Node<AspireNodeData>[];
  edges: Edge[];
  tags: string[];
}

export const templates: Template[] = [
  {
    id: 'web-api-postgres',
    name: 'Web API + PostgreSQL',
    description: 'Simple web API with PostgreSQL database',
    category: 'starter',
    icon: '🚀',
    tags: ['web', 'database', 'starter'],
    nodes: [
      {
        id: 'node_0',
        type: 'aspire',
        position: { x: 100, y: 100 },
        data: {
          resourceType: 'postgres',
          label: 'PostgreSQL',
          icon: '🐘',
          color: '#336791',
          instanceName: 'postgres',
          databaseName: 'appdb',
          allowsDatabase: true,
          persistent: true,
        },
      },
      {
        id: 'node_1',
        type: 'aspire',
        position: { x: 400, y: 100 },
        data: {
          resourceType: 'dotnet-project',
          label: 'C# Project',
          icon: '🔷',
          color: '#512BD4',
          instanceName: 'webapi',
        },
      },
    ],
    edges: [
      {
        id: 'edge_0',
        source: 'node_0',
        target: 'node_1',
        animated: true,
        style: { stroke: '#888', strokeWidth: 2 },
      },
    ],
  },
  {
    id: 'microservices-basic',
    name: 'Microservices with Message Queue',
    description: 'Two services communicating via RabbitMQ',
    category: 'microservices',
    icon: '🏗️',
    tags: ['microservices', 'messaging', 'rabbitmq'],
    nodes: [
      {
        id: 'node_0',
        type: 'aspire',
        position: { x: 250, y: 50 },
        data: {
          resourceType: 'rabbitmq',
          label: 'RabbitMQ',
          icon: '🐰',
          color: '#FF6600',
          instanceName: 'messaging',
        },
      },
      {
        id: 'node_1',
        type: 'aspire',
        position: { x: 100, y: 200 },
        data: {
          resourceType: 'dotnet-project',
          label: 'C# Project',
          icon: '🔷',
          color: '#512BD4',
          instanceName: 'orderservice',
        },
      },
      {
        id: 'node_2',
        type: 'aspire',
        position: { x: 400, y: 200 },
        data: {
          resourceType: 'dotnet-project',
          label: 'C# Project',
          icon: '🔷',
          color: '#512BD4',
          instanceName: 'inventoryservice',
        },
      },
    ],
    edges: [
      {
        id: 'edge_0',
        source: 'node_0',
        target: 'node_1',
        animated: true,
        style: { stroke: '#888', strokeWidth: 2 },
      },
      {
        id: 'edge_1',
        source: 'node_0',
        target: 'node_2',
        animated: true,
        style: { stroke: '#888', strokeWidth: 2 },
      },
    ],
  },
  {
    id: 'fullstack-app',
    name: 'Full Stack Application',
    description: 'React frontend, .NET API, PostgreSQL, Redis cache',
    category: 'fullstack',
    icon: '🌐',
    tags: ['fullstack', 'react', 'cache', 'database'],
    nodes: [
      {
        id: 'node_0',
        type: 'aspire',
        position: { x: 100, y: 50 },
        data: {
          resourceType: 'postgres',
          label: 'PostgreSQL',
          icon: '🐘',
          color: '#336791',
          instanceName: 'postgres',
          databaseName: 'appdb',
          allowsDatabase: true,
          persistent: true,
        },
      },
      {
        id: 'node_1',
        type: 'aspire',
        position: { x: 100, y: 200 },
        data: {
          resourceType: 'redis',
          label: 'Redis',
          icon: '🔴',
          color: '#DC382D',
          instanceName: 'cache',
        },
      },
      {
        id: 'node_2',
        type: 'aspire',
        position: { x: 400, y: 125 },
        data: {
          resourceType: 'dotnet-project',
          label: 'C# Project',
          icon: '🔷',
          color: '#512BD4',
          instanceName: 'api',
        },
      },
      {
        id: 'node_3',
        type: 'aspire',
        position: { x: 700, y: 125 },
        data: {
          resourceType: 'vite-app',
          label: 'Vite App',
          icon: '⚡',
          color: '#646CFF',
          instanceName: 'frontend',
        },
      },
    ],
    edges: [
      {
        id: 'edge_0',
        source: 'node_0',
        target: 'node_2',
        animated: true,
        style: { stroke: '#888', strokeWidth: 2 },
      },
      {
        id: 'edge_1',
        source: 'node_1',
        target: 'node_2',
        animated: true,
        style: { stroke: '#888', strokeWidth: 2 },
      },
      {
        id: 'edge_2',
        source: 'node_2',
        target: 'node_3',
        animated: true,
        style: { stroke: '#888', strokeWidth: 2 },
      },
    ],
  },
  {
    id: 'ai-chatbot',
    name: 'AI Chatbot with Vector DB',
    description: 'OpenAI integration with PostgreSQL for embeddings',
    category: 'ai',
    icon: '🤖',
    tags: ['ai', 'openai', 'postgres', 'chatbot'],
    nodes: [
      {
        id: 'node_0',
        type: 'aspire',
        position: { x: 100, y: 100 },
        data: {
          resourceType: 'openai',
          label: 'OpenAI',
          icon: '🧠',
          color: '#10A37F',
          instanceName: 'openai',
        },
      },
      {
        id: 'node_1',
        type: 'aspire',
        position: { x: 100, y: 250 },
        data: {
          resourceType: 'postgres',
          label: 'PostgreSQL',
          icon: '🐘',
          color: '#336791',
          instanceName: 'vectordb',
          databaseName: 'embeddings',
          allowsDatabase: true,
          persistent: true,
        },
      },
      {
        id: 'node_2',
        type: 'aspire',
        position: { x: 400, y: 175 },
        data: {
          resourceType: 'dotnet-project',
          label: 'C# Project',
          icon: '🔷',
          color: '#512BD4',
          instanceName: 'chatbot',
        },
      },
    ],
    edges: [
      {
        id: 'edge_0',
        source: 'node_0',
        target: 'node_2',
        animated: true,
        style: { stroke: '#888', strokeWidth: 2 },
      },
      {
        id: 'edge_1',
        source: 'node_1',
        target: 'node_2',
        animated: true,
        style: { stroke: '#888', strokeWidth: 2 },
      },
    ],
  },
  {
    id: 'event-driven',
    name: 'Event-Driven Architecture',
    description: 'Kafka-based event streaming with multiple consumers',
    category: 'microservices',
    icon: '📡',
    tags: ['kafka', 'streaming', 'events'],
    nodes: [
      {
        id: 'node_0',
        type: 'aspire',
        position: { x: 250, y: 50 },
        data: {
          resourceType: 'kafka',
          label: 'Kafka',
          icon: '📨',
          color: '#231F20',
          instanceName: 'kafka',
        },
      },
      {
        id: 'node_1',
        type: 'aspire',
        position: { x: 50, y: 200 },
        data: {
          resourceType: 'dotnet-project',
          label: 'C# Project',
          icon: '🔷',
          color: '#512BD4',
          instanceName: 'producer',
        },
      },
      {
        id: 'node_2',
        type: 'aspire',
        position: { x: 250, y: 200 },
        data: {
          resourceType: 'dotnet-project',
          label: 'C# Project',
          icon: '🔷',
          color: '#512BD4',
          instanceName: 'consumer1',
        },
      },
      {
        id: 'node_3',
        type: 'aspire',
        position: { x: 450, y: 200 },
        data: {
          resourceType: 'dotnet-project',
          label: 'C# Project',
          icon: '🔷',
          color: '#512BD4',
          instanceName: 'consumer2',
        },
      },
    ],
    edges: [
      {
        id: 'edge_0',
        source: 'node_0',
        target: 'node_1',
        animated: true,
        style: { stroke: '#888', strokeWidth: 2 },
      },
      {
        id: 'edge_1',
        source: 'node_0',
        target: 'node_2',
        animated: true,
        style: { stroke: '#888', strokeWidth: 2 },
      },
      {
        id: 'edge_2',
        source: 'node_0',
        target: 'node_3',
        animated: true,
        style: { stroke: '#888', strokeWidth: 2 },
      },
    ],
  },
  {
    id: 'multi-database',
    name: 'Multi-Database Application',
    description: 'Application using PostgreSQL, MongoDB, and Redis',
    category: 'data',
    icon: '💾',
    tags: ['database', 'postgres', 'mongodb', 'redis'],
    nodes: [
      {
        id: 'node_0',
        type: 'aspire',
        position: { x: 100, y: 50 },
        data: {
          resourceType: 'postgres',
          label: 'PostgreSQL',
          icon: '🐘',
          color: '#336791',
          instanceName: 'postgres',
          databaseName: 'maindb',
          allowsDatabase: true,
          persistent: true,
        },
      },
      {
        id: 'node_1',
        type: 'aspire',
        position: { x: 100, y: 200 },
        data: {
          resourceType: 'mongodb',
          label: 'MongoDB',
          icon: '🍃',
          color: '#47A248',
          instanceName: 'mongodb',
          databaseName: 'documents',
          allowsDatabase: true,
          persistent: true,
        },
      },
      {
        id: 'node_2',
        type: 'aspire',
        position: { x: 100, y: 350 },
        data: {
          resourceType: 'redis',
          label: 'Redis',
          icon: '🔴',
          color: '#DC382D',
          instanceName: 'cache',
        },
      },
      {
        id: 'node_3',
        type: 'aspire',
        position: { x: 400, y: 200 },
        data: {
          resourceType: 'dotnet-project',
          label: 'C# Project',
          icon: '🔷',
          color: '#512BD4',
          instanceName: 'api',
        },
      },
    ],
    edges: [
      {
        id: 'edge_0',
        source: 'node_0',
        target: 'node_3',
        animated: true,
        style: { stroke: '#888', strokeWidth: 2 },
      },
      {
        id: 'edge_1',
        source: 'node_1',
        target: 'node_3',
        animated: true,
        style: { stroke: '#888', strokeWidth: 2 },
      },
      {
        id: 'edge_2',
        source: 'node_2',
        target: 'node_3',
        animated: true,
        style: { stroke: '#888', strokeWidth: 2 },
      },
    ],
  },
];

export const templateCategories = [
  { id: 'starter', label: 'Starter' },
  { id: 'microservices', label: 'Microservices' },
  { id: 'fullstack', label: 'Full Stack' },
  { id: 'data', label: 'Data' },
  { id: 'ai', label: 'AI' },
];
