# Perfect Test Skill

A comprehensive and well-structured skill that demonstrates best practices in all areas.

## Dependencies

- curl: HTTP client for API requests (`curl --version` to verify)
- jq: JSON parser (`which jq` to verify installation)
- Environment variable: API_KEY (obtain from https://api.example.com)

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

## Usage

This skill is triggered when the user asks to "check system status" or "verify service health".

### Step-by-step instructions:

1. Validate dependencies are available
2. Check API key is configured
3. Make API call to health endpoint
4. Parse response and format for user
5. Handle any errors gracefully

### Example commands:

```bash
# Check if dependencies are available
command -v curl >/dev/null 2>&1 || echo "curl not found"
command -v jq >/dev/null 2>&1 || echo "jq not found"

# Make the API call
curl -H "Authorization: Bearer $API_KEY" \
     -H "Accept: application/json" \
     "https://api.example.com/health" | jq '.status'
```

## Input/Output

**Input:** User request like "check system status"
**Output:** Formatted status report with:
- Service status (online/offline)
- Response time
- Any alerts or issues

## Error Handling

### Common issues and solutions:

- **No API key**: Prompt user to configure API_KEY environment variable
- **Service unavailable**: Return cached status if available, otherwise inform user
- **Network timeout**: Retry once after 2 seconds, then report network issue
- **Invalid response**: Log raw response and return "Unable to parse status"

### Fallback strategies:

1. **Primary**: Live API check
2. **Fallback 1**: Cached status (if < 5 minutes old)
3. **Fallback 2**: Basic connectivity test
4. **Final**: Manual status check instructions

### Validation steps:

```bash
# Verify API response structure
if ! echo "$response" | jq -e '.status' >/dev/null; then
    echo "Invalid response format"
    exit 1
fi
```

## Examples

### Successful execution:
```bash
$ check-status
✅ System Status: HEALTHY
📊 Response Time: 245ms
🔄 Last Updated: 2026-02-11 14:30:00
```

### Error handling:
```bash
$ check-status
❌ Error: API_KEY not configured
💡 Solution: export API_KEY="your_key"
```

## Limitations and Edge Cases

- **Rate limits**: API allows 100 calls/hour, skill caches results for 5 minutes
- **Timeout**: API calls timeout after 10 seconds
- **Platform**: Works on Linux, macOS, Windows (with WSL)
- **Network**: Requires internet connection for live checks

## Troubleshooting

### Q: Getting "command not found" for curl
**A:** Install curl using your package manager (see Installation section)

### Q: API returns 401 Unauthorized
**A:** Check API key is correctly set: `echo $API_KEY`

### Q: Slow response times
**A:** API is experiencing high load, try again in a few minutes

## When NOT to Use This Skill

- **Don't use** this for detailed monitoring or alerting — use a dedicated monitoring skill instead
- **Not for** deploying or restarting services; this is read-only status checking
- **Avoid using this** for historical trend analysis

## Security Notes

- API key is sensitive - never log or expose it
- All API calls use HTTPS encryption
- No data is stored locally beyond 5-minute cache
- Follows principle of least privilege