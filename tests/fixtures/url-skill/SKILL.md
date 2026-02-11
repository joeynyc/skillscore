# API Integration Skill

This skill demonstrates URL handling without false positives for path detection.

## Description

Integrates with various APIs using different URL patterns and paths.

## API Endpoints

- Base URL: https://api.example.com/v1/
- Authentication: https://auth.example.com/oauth/token
- Data endpoint: https://data.example.com/api/v2/fetch
- File upload: https://files.example.com/upload
- CSS resources: https://cdn.example.com/CSS/styles.css
- Static assets: https://assets.example.com/beautifying/theme.css
- Natural language API: https://nlp.example.com/natural/language/process

## Usage

```bash
# Authenticate first
curl -X POST https://auth.example.com/oauth/token \
  -d "grant_type=client_credentials"

# Fetch data
curl https://data.example.com/api/v2/fetch?query=test

# Upload file  
curl -F "file=@document.pdf" https://files.example.com/upload
```

## Dependencies

- curl for HTTP requests
- Standard Unix tools

## Notes

All URLs use HTTPS and follow RESTful patterns. No hardcoded filesystem paths are used.