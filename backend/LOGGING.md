# Production Logging Guide

## Overview

This document describes the logging configuration for the New Delhi Electricals API in production environments.

## Configuration

### Environment Variables

Set these variables in your `.env` file:

```bash
APP_ENV="production"  # Set to "production" for production deployments
LOG_LEVEL="INFO"      # Options: DEBUG, INFO, WARNING, ERROR, CRITICAL
```

### Log Levels

- **DEBUG**: Detailed information for diagnosing problems (development only)
- **INFO**: General informational messages (default for production)
- **WARNING**: Warning messages for potentially harmful situations
- **ERROR**: Error messages for serious problems
- **CRITICAL**: Critical messages for very serious errors

## Production Best Practices

### 1. Never Log Sensitive Information

The following information should NEVER be logged:

- Passwords (plain text or hashed)
- JWT tokens
- API keys or secrets
- Credit card numbers
- Personal identification numbers
- Full email addresses in error messages (use masked versions if needed)
- MongoDB connection strings with credentials

### 2. Log Levels in Production

In production (`APP_ENV="production"`):

- Set `LOG_LEVEL="INFO"` or higher
- Third-party library logs are automatically reduced to WARNING level
- Exception tracebacks are not included in error responses (only logged internally)
- Generic error messages are returned to clients

### 3. What to Log

**DO log:**
- Request paths and methods (without sensitive query parameters)
- Error types and general error messages
- Performance metrics
- Database connection status
- External service failures (email, Cloudinary)

**DON'T log:**
- Request bodies containing passwords or tokens
- Full user data
- Database query results containing sensitive data
- Stack traces in production error responses

### 4. Error Handling

The application uses consistent error handling:

```python
# In production: Generic error message
{
  "message": "An internal error occurred",
  "code": "INTERNAL_ERROR",
  "timestamp": "2024-01-01T00:00:00"
}

# In development: Detailed error message
{
  "message": "An internal error occurred: Division by zero",
  "code": "INTERNAL_ERROR",
  "timestamp": "2024-01-01T00:00:00"
}
```

### 5. Monitoring

For production deployments, consider:

- Using a centralized logging service (e.g., CloudWatch, Datadog, Sentry)
- Setting up alerts for ERROR and CRITICAL level logs
- Monitoring log volume for anomalies
- Regular log rotation to prevent disk space issues

## Example Production Configuration

```bash
# .env for production
APP_ENV="production"
LOG_LEVEL="INFO"
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/db"
JWT_SECRET_KEY="your-secret-key-here"
# ... other settings
```

## Testing Logging Configuration

To test logging in different environments:

```bash
# Development (verbose logging)
APP_ENV="development" LOG_LEVEL="DEBUG" uvicorn app.main:app

# Production (minimal logging)
APP_ENV="production" LOG_LEVEL="INFO" uvicorn app.main:app
```

## Log Format

Logs follow this format:

```
2024-01-01 12:00:00,000 - app.routes.products - INFO - Product created: SKU123
```

Format: `timestamp - logger_name - level - message`

## Security Considerations

1. **Log Injection**: All user input is sanitized before logging
2. **Log Access**: Restrict access to log files in production
3. **Log Retention**: Define and implement a log retention policy
4. **Compliance**: Ensure logging complies with GDPR and other regulations

## Troubleshooting

### Too Many Logs

If logs are too verbose:
- Increase `LOG_LEVEL` to `WARNING` or `ERROR`
- Check third-party library log levels

### Missing Logs

If logs are missing:
- Verify `LOG_LEVEL` is not set too high
- Check that logging is configured before application startup
- Verify log output destination (stdout, file, etc.)

### Performance Impact

Excessive logging can impact performance:
- Use appropriate log levels
- Avoid logging in tight loops
- Consider async logging for high-volume applications
