---
name: system-health-checker
description: Checks system service health and status when the user asks to verify service availability or diagnose outages.
---

# System Health Checker

Evaluates service health endpoints and produces formatted status reports.

## When to Use

This skill is triggered when the user asks to "check system status" or "verify service health".

## When NOT to Use

- **Don't use** this for detailed monitoring or alerting — use a dedicated monitoring skill instead
- **Not for** deploying or restarting services; this is read-only status checking
- **Avoid using this** for historical trend analysis

## Dependencies

- curl: HTTP client for API requests (`curl --version` to verify)
- jq: JSON parser (`which jq` to verify installation)
- Environment variable: API_KEY (obtain from the service dashboard)

## Installation

```bash
# Install curl (if not present)
sudo apt-get install curl  # Ubuntu/Debian
brew install curl          # macOS

# Install jq
sudo apt-get install jq    # Ubuntu/Debian
brew install jq            # macOS

# Set API key
export API_KEY="your_api_key_here"
```

## Workflow

1. Validate dependencies are available
2. Check API key is configured
3. Make API call to health endpoint
4. Parse response and format for user
5. Handle any errors gracefully

- [ ] Verify curl and jq are installed
- [ ] Confirm API_KEY is set
- [ ] Check endpoint responds

### Example commands:

```bash
# Check if dependencies are available
command -v curl >/dev/null 2>&1 || echo "curl not found"
command -v jq >/dev/null 2>&1 || echo "jq not found"

# Make the API call
if ! response=$(curl -s -H "Authorization: Bearer $API_KEY" \
     -H "Accept: application/json" \
     "https://api.example.com/health"); then
  echo "Error: API call failed"
  exit 1
fi

echo "$response" | jq '.status'
```

## Input/Output

**Input:** User request like "check system status"
**Output:** Formatted status report with:
- Service status (online/offline)
- Response time
- Any alerts or issues

## Error Handling

You must always check for errors. Consider retrying on transient failures.

### Common issues and solutions:

- **No API key**: Prompt user to configure API_KEY environment variable
- **Service unavailable**: Return cached status if available, otherwise inform user
- **Network timeout**: Retry once, then report network issue
- **Invalid response**: Log raw response and return "Unable to parse status"

### Fallback strategies:

1. **Primary**: Live API check
2. **Fallback 1**: Cached status (if recent)
3. **Fallback 2**: Basic connectivity test
4. **Final**: Manual status check instructions

### Validation:

```bash
# Verify API response structure
if ! echo "$response" | jq -e '.status' >/dev/null 2>&1; then
    echo "Invalid response format"
    exit 1
fi
```

## Examples

### Successful execution:
```bash
$ check-status
System Status: HEALTHY
Response Time: 245ms
```

### Error case:
```bash
$ check-status
Error: API_KEY not configured
Solution: export API_KEY="your_key"
```

## Limitations

- Rate limits: API allows 100 calls/hour; the skill caches results
- Timeout: API calls timeout after 10 seconds
- Platform: Works on Linux, macOS, Windows (with WSL)
- Network: Requires internet connection for live checks

## Troubleshooting

### Q: Getting "command not found" for curl
**A:** Install curl using your package manager (see Installation section)

### Q: API returns 401 Unauthorized
**A:** Verify the result of `echo $API_KEY` — ensure it is set correctly

### Q: Slow response times
**A:** Review the endpoint load; optionally adjust timeout thresholds

## Security Notes

- API key is sensitive — never log or expose it
- All API calls use HTTPS encryption
- No data is stored locally beyond cache
- Follows principle of least privilege

See [examples/advanced-usage.md](examples/advanced-usage.md) for additional patterns.
