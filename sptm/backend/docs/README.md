# API Documentation Maintenance System

This directory contains the documentation maintenance system for the SPTM Backend API. The system provides automated validation, coverage tracking, and maintenance tools to ensure high-quality API documentation.

## 📁 Directory Structure

```
backend/docs/
├── README.md                           # This file
├── DOCUMENTATION_MAINTENANCE.md        # Maintenance guidelines
├── DOCUMENTATION_CHECKLIST.md          # Development checklist
├── api-coverage-report.json           # Generated coverage report
├── validation-results.json            # Generated validation results
├── example-test-results.json          # Generated example test results
├── monitoring-report.json             # Latest monitoring report
├── monitoring-history.json            # Historical monitoring data
└── openapi.json                       # Generated OpenAPI specification
```

## 🛠️ Available Commands

### Validation and Testing

```bash
# Validate OpenAPI specification
npm run docs:validate

# Check documentation coverage
npm run docs:coverage

# Test documentation examples
npm run docs:test-examples

# Run all documentation checks
npm run docs:report
```

### Generation and Monitoring

```bash
# Generate standalone OpenAPI specification
npm run docs:generate

# Generate monitoring report
npm run docs:monitor

# Generate weekly/monthly reports
npm run docs:monitor:weekly
npm run docs:monitor:monthly
```

## 🚀 Quick Start

### For New Developers

1. **Read the guidelines**: Start with [DOCUMENTATION_MAINTENANCE.md](./DOCUMENTATION_MAINTENANCE.md)
2. **Use the checklist**: Follow [DOCUMENTATION_CHECKLIST.md](./DOCUMENTATION_CHECKLIST.md) when adding documentation
3. **Run validation**: Always run `npm run docs:validate` before committing
4. **Check coverage**: Use `npm run docs:coverage` to find undocumented endpoints

### For Maintainers

1. **Monitor health**: Run `npm run docs:monitor` regularly
2. **Review reports**: Check generated JSON reports for detailed metrics
3. **Address alerts**: Prioritize fixing critical alerts and declining trends
4. **Update guidelines**: Keep maintenance guidelines current with project needs

## 📊 Quality Metrics

### Coverage Standards

- **Minimum**: 80% of endpoints documented
- **Target**: 90%+ coverage for production APIs
- **Critical**: 100% coverage for authentication endpoints

### Validation Standards

- **Zero errors**: All validation must pass
- **Minimal warnings**: Keep warnings under 5
- **Example accuracy**: 90%+ example success rate

## 🔧 Automation

### Pre-commit Hooks

The system includes pre-commit hooks that automatically:

- Validate OpenAPI specification
- Check documentation coverage
- Test examples for accuracy
- Lint markdown files

Install with:
```bash
pip install pre-commit
pre-commit install
```

### CI/CD Integration

GitHub Actions workflow automatically:

- Validates documentation on pull requests
- Generates coverage reports
- Posts PR comments with metrics
- Deploys documentation on merge

## 📈 Monitoring and Reporting

### Daily Monitoring

The monitoring system tracks:

- **Validation Status**: Pass/fail status with error counts
- **Coverage Metrics**: Percentage and trends over time
- **Example Health**: Success rates and failure patterns
- **Quality Trends**: Improvement or degradation indicators

### Report Types

1. **Validation Report** (`validation-results.json`)
   - OpenAPI specification validity
   - Schema reference integrity
   - Example structure validation

2. **Coverage Report** (`api-coverage-report.json`)
   - Endpoint documentation coverage
   - Category-wise breakdown
   - Undocumented endpoint list

3. **Example Test Report** (`example-test-results.json`)
   - Example validation results
   - Success/failure breakdown
   - Structural validation

4. **Monitoring Report** (`monitoring-report.json`)
   - Combined health metrics
   - Trend analysis
   - Recommendations and alerts

## 🚨 Alert System

### Critical Alerts

- Documentation validation failures
- Coverage below 50%
- High number of validation errors

### Warning Alerts

- Coverage below 70%
- Example success rate below 80%
- Declining quality trends

### Trend Alerts

- Coverage declining over time
- Example success rate dropping
- Increasing validation errors

## 🔄 Maintenance Workflow

### Weekly Tasks

1. Review monitoring reports
2. Address critical alerts
3. Update examples with current data
4. Check for new undocumented endpoints

### Monthly Tasks

1. Review and update documentation standards
2. Analyze quality trends
3. Plan documentation improvements
4. Update maintenance guidelines

### Release Tasks

1. Validate all documentation
2. Generate final OpenAPI specification
3. Deploy updated documentation
4. Notify stakeholders of changes

## 🛠️ Troubleshooting

### Common Issues

**Validation Failures**
- Check JSDoc syntax in route files
- Verify schema references in `apiSchemas.ts`
- Ensure all required OpenAPI fields are present

**Coverage Issues**
- Run `npm run docs:coverage` to identify gaps
- Add JSDoc comments to undocumented endpoints
- Update swagger configuration if needed

**Example Problems**
- Verify example data matches schema definitions
- Check for API changes affecting examples
- Update examples with current valid data

### Getting Help

1. Check the troubleshooting section in maintenance guidelines
2. Review validation output for specific error messages
3. Examine existing documented endpoints as examples
4. Consult OpenAPI 3.0 specification for syntax
5. Ask team members for documentation review

## 📚 Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [JSDoc Documentation](https://jsdoc.app/)
- [Pre-commit Hooks](https://pre-commit.com/)

## 🤝 Contributing

When contributing to the documentation system:

1. Follow the established patterns and standards
2. Update guidelines when adding new features
3. Test changes thoroughly before submitting
4. Document any new scripts or tools
5. Consider backward compatibility

## 📞 Support

For questions or issues with the documentation system:

1. Check this README and maintenance guidelines
2. Review existing issues and solutions
3. Test with the provided validation tools
4. Consult with the development team
5. Update documentation based on learnings