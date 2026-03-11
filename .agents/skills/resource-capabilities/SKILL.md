---
name: resource-capabilities
description: Generates and maintains resource definitions derived from official Aspire.dev Hosting integration/NuGet packages, using public API surfaces as the rules engine for resource composition.
---

# Resource Capabilities Skill

## Overview

This skill is responsible for generating and maintaining resource definitions derived from the official [Aspire.dev](https://aspire.dev) **Hosting** integration/NuGet packages. Every resource in this system corresponds to a real Aspire Hosting integration, and its public API surface defines the rules engine that governs how resources can be connected, configured, and composed.

## Core Principles

1. **All resources MUST be mapped.** There is no partial coverage. Every Aspire Hosting integration package listed on aspire.dev must have a corresponding resource definition.
2. **Public APIs define the rules engine.** The public API surface of each NuGet package (types, extension methods, parameters, return types) is the single source of truth for what a resource can do, what it exposes, and how it connects to other resources.
3. **Version-aware generation.** Resource definitions are generated per Aspire version. When a new version of Aspire is released, the generation pipeline must be re-run to capture any API changes, additions, or deprecations.

## Generation Pipeline

### Step 1: Discover Hosting Packages

Enumerate all `Aspire.Hosting.*` NuGet packages from the official NuGet feed that are listed as hosting integrations on aspire.dev.
