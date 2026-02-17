import { parseAppHost } from './src/utils/importParsers';

const testAppHost = `#:sdk Aspire.AppHost.Sdk@13.0.0
#:package Aspire.Hosting.PostgreSQL@13.0.0
#:package Aspire.Hosting.Redis@13.0.0
#:package Aspire.Hosting.NodeJs@13.0.0

var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .WithLifetime(ContainerLifetime.Persistent);
var appdb = postgres.AddDatabase("appdb");

var redis = builder.AddRedis("redis");

var rabbitmq = builder.AddRabbitMQ("rabbitmq");

var api = builder.AddProject<Projects.Api>("api")
    .WithEnvironment("ASPNETCORE_ENVIRONMENT", "Development")
    .WithHttpEndpoint(port: 8080, targetPort: 80)
    .WithReplicas(3)
    .WithReference(appdb)
    .WithReference(redis)
    .WaitFor(appdb);

var frontend = builder.AddNodeApp("frontend", "../frontend")
    .WithEnvironment("NODE_ENV", "production")
    .WithEnvironment("API_URL", "http://api")
    .WithHttpEndpoint(port: 3000, targetPort: 3000)
    .WithReference(api);

builder.Build().Run();`;

console.log('Testing AppHost parser...\n');

const result = parseAppHost(testAppHost);

console.log(`Found ${result.nodes.length} nodes:`);
result.nodes.forEach(node => {
  console.log(`  - ${node.data.instanceName} (${node.data.resourceType})`);
  if (node.data.databaseName) {
    console.log(`    Database: ${node.data.databaseName}`);
  }
  if (node.data.envVars && node.data.envVars.length > 0) {
    console.log(`    Env vars: ${node.data.envVars.map(e => `${e.key}=${e.value}`).join(', ')}`);
  }
  if (node.data.ports && node.data.ports.length > 0) {
    console.log(`    Ports: ${node.data.ports.map(p => `${p.host || '?'}:${p.container}`).join(', ')}`);
  }
  if (node.data.replicas) {
    console.log(`    Replicas: ${node.data.replicas}`);
  }
  if (node.data.persistent) {
    console.log(`    Persistent: true`);
  }
});

console.log(`\nFound ${result.edges.length} edges:`);
result.edges.forEach(edge => {
  const source = result.nodes.find(n => n.id === edge.source);
  const target = result.nodes.find(n => n.id === edge.target);
  console.log(`  - ${source?.data.instanceName} -> ${target?.data.instanceName || target?.data.databaseName}`);
});

if (result.warnings.length > 0) {
  console.log(`\nWarnings:`);
  result.warnings.forEach(w => console.log(`  - ${w}`));
}

console.log('\n✅ Test completed!');
