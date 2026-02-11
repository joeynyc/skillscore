# Weather Information Fetcher

Fetches current weather data for any city using OpenWeatherMap API.

## Dependencies

- curl or wget for HTTP requests
- OpenWeatherMap API key (free registration at openweathermap.org)
- Environment variable: OPENWEATHER_API_KEY

## Installation

1. Sign up for API key at https://openweathermap.org/api
2. Set environment variable: `export OPENWEATHER_API_KEY=your_api_key`
3. Ensure curl is installed: `which curl`

## Usage

1. When user asks for weather information for a specific city
2. Extract the city name from the request
3. Make API call: `curl "http://api.openweathermap.org/data/2.5/weather?q=CITY&appid=$OPENWEATHER_API_KEY&units=metric"`
4. Parse the JSON response and format for user
5. Handle errors gracefully if city not found or API unavailable

## Examples

```bash
# Example API call
curl "http://api.openweathermap.org/data/2.5/weather?q=London&appid=your_api_key&units=metric"
```

Expected response includes temperature, description, humidity, and pressure.

## Error Handling

- **No API key**: Prompt user to set OPENWEATHER_API_KEY environment variable
- **City not found**: Return "City not found, please check spelling"
- **API down**: Fallback to generic message "Weather service temporarily unavailable"
- **Network error**: Retry once, then inform user of connection issue

## Limitations

- Requires internet connection
- API has rate limits (1000 calls/day for free tier)
- Only supports current weather (not forecasts)
- City names must be in English

## Troubleshooting

If you get "unauthorized" error:
1. Verify API key is correct
2. Check if key is activated (can take up to 10 minutes)
3. Ensure environment variable is set properly