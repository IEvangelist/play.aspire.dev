import { test, expect } from '@playwright/test';

test.describe('AppHost Round-Trip Import/Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
  });

  test('should round-trip a complex AppHost configuration', async ({ page }) => {
    // Step 1: Create a complex application with various resources
    console.log('Step 1: Creating complex application...');
    
    // Add Postgres with database
    await page.locator('text=PostgreSQL').click();
    await page.locator('input[placeholder="Name this resource..."]').fill('postgres');
    await page.keyboard.press('Escape');
    
    // Add database to postgres
    await page.locator('text=postgres').click();
    await page.locator('input[placeholder="Database name..."]').fill('appdb');
    await page.keyboard.press('Escape');
    
    // Add Redis
    await page.locator('text=Redis').click();
    await page.locator('input[placeholder="Name this resource..."]').fill('redis');
    await page.keyboard.press('Escape');
    
    // Add RabbitMQ
    await page.locator('text=RabbitMQ').click();
    await page.locator('input[placeholder="Name this resource..."]').fill('rabbitmq');
    await page.keyboard.press('Escape');
    
    // Add .NET Project
    await page.locator('text=.NET Project').click();
    await page.locator('input[placeholder="Name this resource..."]').fill('api');
    await page.keyboard.press('Escape');
    
    // Add Node.js App
    await page.locator('text=Node.js App').click();
    await page.locator('input[placeholder="Name this resource..."]').fill('frontend');
    await page.keyboard.press('Escape');
    
    // Create connections: api -> postgres db, api -> redis, api -> rabbitmq
    // This needs to be done via the UI drag/drop or connection mechanism
    // For now, let's just verify we can export
    
    // Step 2: Export the configuration
    console.log('Step 2: Exporting configuration...');
    await page.locator('button:has-text("Code")').click();
    
    // Wait for code to be generated
    await page.waitForTimeout(500);
    
    // Get the generated AppHost code
    const codePreview = page.locator('.monaco-editor, [class*="code-preview"], pre').first();
    const exportedCode = await codePreview.textContent();
    
    console.log('Exported code:', exportedCode);
    
    // Verify code contains all resources
    expect(exportedCode).toContain('AddPostgres');
    expect(exportedCode).toContain('AddRedis');
    expect(exportedCode).toContain('AddRabbitMQ');
    expect(exportedCode).toContain('AddProject');
    expect(exportedCode).toContain('AddNodeApp');
    expect(exportedCode).toContain('AddDatabase');
    
    // Step 3: Clear the canvas
    console.log('Step 3: Clearing canvas...');
    await page.locator('button[title*="Clear"], button:has-text("Clear")').click();
    
    // Confirm the clear action if there's a dialog
    const confirmButton = page.locator('button:has-text("Clear")').last();
    if (await confirmButton.isVisible({ timeout: 1000 })) {
      await confirmButton.click();
    }
    
    // Verify canvas is empty
    await page.waitForTimeout(500);
    const nodes = page.locator('[class*="react-flow__node"]');
    await expect(nodes).toHaveCount(0);
    
    // Step 4: Import the exported code
    console.log('Step 4: Importing configuration...');
    
    // Click import button
    await page.locator('button:has-text("Import"), button[title*="Import"]').click();
    
    // Select AppHost.cs option
    await page.locator('text=AppHost.cs').click();
    
    // Create a temporary file with the exported code
    // This simulates uploading the file
    const buffer = Buffer.from(exportedCode!, 'utf-8');
    
    // Find the file input and upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'Program.cs',
      mimeType: 'text/plain',
      buffer: buffer,
    });
    
    // Wait for import to complete
    await page.waitForTimeout(1000);
    
    // Step 5: Verify all resources were imported
    console.log('Step 5: Verifying imported resources...');
    
    const importedNodes = page.locator('[class*="react-flow__node"]');
    const nodeCount = await importedNodes.count();
    
    console.log('Imported nodes count:', nodeCount);
    
    // We should have at least 5 resources (postgres, appdb shows as part of postgres, redis, rabbitmq, api, frontend)
    // Actually we should have 5 separate nodes
    expect(nodeCount).toBeGreaterThanOrEqual(5);
    
    // Verify specific resources are present
    await expect(page.locator('text=postgres')).toBeVisible();
    await expect(page.locator('text=redis')).toBeVisible();
    await expect(page.locator('text=rabbitmq')).toBeVisible();
    await expect(page.locator('text=api')).toBeVisible();
    await expect(page.locator('text=frontend')).toBeVisible();
    
    // Step 6: Re-export and compare
    console.log('Step 6: Re-exporting to verify round-trip...');
    await page.locator('button:has-text("Code")').click();
    await page.waitForTimeout(500);
    
    const reExportedCode = await codePreview.textContent();
    
    console.log('Re-exported code:', reExportedCode);
    
    // The re-exported code should contain all the same resources
    expect(reExportedCode).toContain('AddPostgres');
    expect(reExportedCode).toContain('AddRedis');
    expect(reExportedCode).toContain('AddRabbitMQ');
    expect(reExportedCode).toContain('AddProject');
    expect(reExportedCode).toContain('AddNodeApp');
    expect(reExportedCode).toContain('AddDatabase');
  });

  test('should handle database references correctly', async ({ page }) => {
    const appHostCode = `#:sdk Aspire.AppHost.Sdk@13.0.0
#:package Aspire.Hosting.PostgreSQL@13.0.0

var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .WithLifetime(ContainerLifetime.Persistent);
var appdb = postgres.AddDatabase("appdb");

var api = builder.AddProject<Projects.Api>("api")
    .WithReference(appdb)
    .WaitFor(appdb);

builder.Build().Run();`;

    // Import this code
    await page.locator('button:has-text("Import")').click();
    await page.locator('text=AppHost.cs').click();
    
    const buffer = Buffer.from(appHostCode, 'utf-8');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'Program.cs',
      mimeType: 'text/plain',
      buffer: buffer,
    });
    
    await page.waitForTimeout(1000);
    
    // Verify resources
    const nodes = page.locator('[class*="react-flow__node"]');
    expect(await nodes.count()).toBeGreaterThanOrEqual(2);
    
    // Verify connections exist
    const edges = page.locator('[class*="react-flow__edge"]');
    expect(await edges.count()).toBeGreaterThanOrEqual(1);
  });

  test('should handle environment variables and ports', async ({ page }) => {
    const appHostCode = `#:sdk Aspire.AppHost.Sdk@13.0.0
#:package Aspire.Hosting.NodeJs@13.0.0

var builder = DistributedApplication.CreateBuilder(args);

var api = builder.AddNodeApp("api", "../api")
    .WithEnvironment("NODE_ENV", "production")
    .WithEnvironment("PORT", "3000")
    .WithHttpEndpoint(port: 8080, targetPort: 3000);

builder.Build().Run();`;

    await page.locator('button:has-text("Import")').click();
    await page.locator('text=AppHost.cs').click();
    
    const buffer = Buffer.from(appHostCode, 'utf-8');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'Program.cs',
      mimeType: 'text/plain',
      buffer: buffer,
    });
    
    await page.waitForTimeout(1000);
    
    // Click on the node to verify env vars and ports
    await page.locator('text=api').click();
    
    // Check if config panel shows the settings
    await expect(page.locator('text=NODE_ENV')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=production')).toBeVisible();
  });

  test('should handle replicas', async ({ page }) => {
    const appHostCode = `#:sdk Aspire.AppHost.Sdk@13.0.0

var builder = DistributedApplication.CreateBuilder(args);

var api = builder.AddProject<Projects.Api>("api")
    .WithReplicas(3);

builder.Build().Run();`;

    await page.locator('button:has-text("Import")').click();
    await page.locator('text=AppHost.cs').click();
    
    const buffer = Buffer.from(appHostCode, 'utf-8');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'Program.cs',
      mimeType: 'text/plain',
      buffer: buffer,
    });
    
    await page.waitForTimeout(1000);
    
    // Click on the node
    await page.locator('text=api').click();
    
    // Check if replicas = 3
    await expect(page.locator('input[type="number"]').filter({ hasText: '3' })).toBeVisible({ timeout: 5000 });
  });
});
