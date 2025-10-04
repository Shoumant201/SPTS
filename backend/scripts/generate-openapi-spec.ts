#!/usr/bin/env tsx

/**
 * OpenAPI Specification Generator
 * 
 * This script generates a standalone OpenAPI specification file
 * that can be used for documentation deployment or external tools.
 */

import fs from 'fs';
import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import { swaggerConfig } from '../src/config/swagger';

interface GenerationOptions {
  outputPath?: string;
  format?: 'json' | 'yaml';
  minify?: boolean;
  includeExamples?: boolean;
}

class OpenAPIGenerator {
  private options: GenerationOptions;

  constructor(options: GenerationOptions = {}) {
    this.options = {
      outputPath: options.outputPath || path.join(__dirname, '../docs/openapi.json'),
      format: options.format || 'json',
      minify: options.minify || false,
      includeExamples: options.includeExamples !== false
    };
  }

  async generate(): Promise<void> {
    console.log('📄 Generating OpenAPI specification...\n');

    try {
      // 1. Generate the specification
      const spec = this.generateSpec();

      // 2. Process the specification
      const processedSpec = this.processSpec(spec);

      // 3. Save to file
      await this.saveSpec(processedSpec);

      // 4. Validate the generated spec
      await this.validateGeneratedSpec(processedSpec);

      console.log('✅ OpenAPI specification generated successfully');

    } catch (error) {
      console.error('❌ Failed to generate OpenAPI specification:', error);
      throw error;
    }
  }

  private generateSpec(): any {
    try {
      const spec = swaggerJSDoc(swaggerConfig);
      
      if (!spec || typeof spec !== 'object') {
        throw new Error('Failed to generate valid OpenAPI specification');
      }

      return spec;
    } catch (error) {
      throw new Error(`Specification generation failed: ${error.message}`);
    }
  }

  private processSpec(spec: any): any {
    const processed = JSON.parse(JSON.stringify(spec)); // Deep clone

    // Add generation metadata
    processed.info = processed.info || {};
    processed.info['x-generated-at'] = new Date().toISOString();
    processed.info['x-generator'] = 'SPTM OpenAPI Generator';

    // Remove examples if requested
    if (!this.options.includeExamples) {
      this.removeExamples(processed);
    }

    // Add server information based on environment
    if (!processed.servers || processed.servers.length === 0) {
      processed.servers = [
        {
          url: process.env.API_BASE_URL || 'http://localhost:3001',
          description: 'SPTM Backend API'
        }
      ];
    }

    // Ensure required OpenAPI fields
    if (!processed.openapi) {
      processed.openapi = '3.0.0';
    }

    if (!processed.info.title) {
      processed.info.title = 'SPTM Backend API';
    }

    if (!processed.info.version) {
      processed.info.version = '1.0.0';
    }

    return processed;
  }

  private removeExamples(spec: any): void {
    const removeExamplesRecursive = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return;

      if (obj.examples) {
        delete obj.examples;
      }

      if (obj.example) {
        delete obj.example;
      }

      for (const value of Object.values(obj)) {
        if (typeof value === 'object') {
          removeExamplesRecursive(value);
        }
      }
    };

    removeExamplesRecursive(spec);
  }

  private async saveSpec(spec: any): Promise<void> {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(this.options.outputPath!);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      let content: string;

      if (this.options.format === 'yaml') {
        // For YAML output, you would need to install and use a YAML library
        // For now, we'll stick with JSON
        console.warn('YAML format not implemented, using JSON instead');
        content = this.options.minify 
          ? JSON.stringify(spec)
          : JSON.stringify(spec, null, 2);
      } else {
        content = this.options.minify 
          ? JSON.stringify(spec)
          : JSON.stringify(spec, null, 2);
      }

      fs.writeFileSync(this.options.outputPath!, content, 'utf-8');
      
      const fileSize = (fs.statSync(this.options.outputPath!).size / 1024).toFixed(2);
      console.log(`📄 Specification saved to: ${this.options.outputPath}`);
      console.log(`📊 File size: ${fileSize} KB`);

    } catch (error) {
      throw new Error(`Failed to save specification: ${error.message}`);
    }
  }

  private async validateGeneratedSpec(spec: any): Promise<void> {
    console.log('🔍 Validating generated specification...');

    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    if (!spec.openapi) {
      errors.push('Missing OpenAPI version');
    }

    if (!spec.info) {
      errors.push('Missing info section');
    } else {
      if (!spec.info.title) {
        errors.push('Missing API title');
      }
      if (!spec.info.version) {
        errors.push('Missing API version');
      }
    }

    if (!spec.paths || Object.keys(spec.paths).length === 0) {
      warnings.push('No paths defined');
    }

    // Count endpoints and schemas
    const pathCount = spec.paths ? Object.keys(spec.paths).length : 0;
    const schemaCount = spec.components?.schemas ? Object.keys(spec.components.schemas).length : 0;
    
    console.log(`📊 Specification statistics:`);
    console.log(`   - Paths: ${pathCount}`);
    console.log(`   - Schemas: ${schemaCount}`);
    console.log(`   - Servers: ${spec.servers?.length || 0}`);

    // Report validation results
    if (errors.length > 0) {
      console.log('\n❌ Validation errors:');
      errors.forEach(error => console.log(`   - ${error}`));
      throw new Error('Generated specification has validation errors');
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Validation warnings:');
      warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    console.log('✅ Generated specification is valid');
  }

  // Method to generate multiple formats
  async generateMultipleFormats(): Promise<void> {
    const formats: Array<{ format: 'json' | 'yaml'; extension: string }> = [
      { format: 'json', extension: 'json' },
      // { format: 'yaml', extension: 'yaml' } // Uncomment when YAML support is added
    ];

    for (const { format, extension } of formats) {
      const basePath = this.options.outputPath!.replace(/\.[^.]+$/, '');
      const formatPath = `${basePath}.${extension}`;
      
      const generator = new OpenAPIGenerator({
        ...this.options,
        outputPath: formatPath,
        format
      });

      await generator.generate();
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options: GenerationOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--output':
      case '-o':
        options.outputPath = args[++i];
        break;
      case '--format':
      case '-f':
        options.format = args[++i] as 'json' | 'yaml';
        break;
      case '--minify':
        options.minify = true;
        break;
      case '--no-examples':
        options.includeExamples = false;
        break;
      case '--help':
      case '-h':
        console.log(`
OpenAPI Specification Generator

Usage: tsx generate-openapi-spec.ts [options]

Options:
  -o, --output <path>     Output file path (default: ../docs/openapi.json)
  -f, --format <format>   Output format: json|yaml (default: json)
  --minify               Minify the output
  --no-examples          Exclude examples from the specification
  -h, --help             Show this help message

Examples:
  tsx generate-openapi-spec.ts
  tsx generate-openapi-spec.ts --output ./api-spec.json --minify
  tsx generate-openapi-spec.ts --format yaml --no-examples
        `);
        process.exit(0);
        break;
      default:
        console.warn(`Unknown argument: ${arg}`);
        break;
    }
  }

  try {
    const generator = new OpenAPIGenerator(options);
    await generator.generate();
    
    console.log('\n🎉 OpenAPI specification generation completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Generation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { OpenAPIGenerator };