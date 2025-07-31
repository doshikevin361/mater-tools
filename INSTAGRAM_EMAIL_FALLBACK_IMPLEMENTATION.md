# Instagram Account Creation with Mail.tm Email Service

## Overview

This implementation uses the mail.tm API as the primary and only email service for Instagram account creation. The system creates temporary email accounts through mail.tm and handles OTP verification for Instagram account registration.

## Features Implemented

### 1. Mail.tm Email Service (Primary and Only)
- **Service**: mail.tm API exclusively
- **Domain Management**: Fetches available domains from `https://api.mail.tm/domains`
- **Account Creation**: Creates temporary email accounts with secure passwords
- **OTP Verification**: Polls mailbox for Instagram verification emails

### 2. Mail.tm API Integration

#### Domain Management
- Fetches available domains from `https://api.mail.tm/domains`
- Filters for active domains only
- Randomly selects from available active domains
- Handles API response structure correctly (array format)

#### Account Creation
- Creates temporary email accounts with secure passwords
- Generates unique usernames with timestamps
- Authenticates and obtains access tokens
- Stores account information for OTP retrieval

#### OTP Verification
- Polls mailbox for Instagram verification emails
- Parses email content for 6-digit OTP codes
- Supports multiple OTP patterns:
  - `(\d{6})\s+is\s+your\s+Instagram\s+code`
  - `Instagram\s+code:\s*(\d{6})`
  - `Your\s+Instagram\s+code\s+is\s+(\d{6})`
  - `(\d{6})\s+is\s+your\s+verification\s+code`
  - `verification\s+code:\s*(\d{6})`
- Fallback to any 6-digit code when Instagram is mentioned

### 3. OTP Checking System

#### Mail.tm OTP Checking
- `checkEmailForInstagramOTP()` function uses mail.tm exclusively
- `checkMailTmForOTP()` function for mail.tm service
- Uses API authentication with stored tokens
- Polls messages endpoint for new emails
- Retrieves full message content for OTP extraction
- Implements fallback mechanisms for OTP extraction

### 4. Database Integration

#### Account Storage
- Stores email provider information (`emailProvider: "mailtm"`)
- Tracks email service usage
- Maintains backward compatibility with existing data

#### Account Data Structure
```javascript
{
  email: "user_123456_78901@somoj.com",
  emailProvider: "mailtm",
  emailFallbackUsed: false, // Always false since no fallback
  // ... other existing fields
}
```

### 5. Error Handling and Logging

#### Comprehensive Error Handling
- Detailed error logging for debugging
- Timeout handling for API calls
- Network error recovery

#### Enhanced Logging
- Provider-specific log messages
- OTP method tracking (pattern_match, instagram_mention, fallback)
- Success/failure status for each step

## API Endpoints

### Mail.tm API Endpoints Used
1. **GET** `/domains` - Fetch available domains
2. **POST** `/accounts` - Create email account
3. **POST** `/token` - Authenticate and get access token
4. **GET** `/messages` - Fetch mailbox messages
5. **GET** `/messages/{id}` - Get specific message content

## Implementation Details

### Email Creation Flow
1. Fetch available domains from mail.tm
2. Select random active domain
3. Generate unique username and email
4. Create account with secure password
5. Authenticate and get access token
6. Return email with provider information

### OTP Verification Flow
1. Use stored authentication token
2. Poll messages endpoint for new emails
3. Check for Instagram verification emails
4. Extract OTP using pattern matching
5. Return OTP with method tracking

### Fallback Mechanisms
- **OTP Extraction**: Pattern matching → Instagram mention → Random fallback
- **API Errors**: Retry with exponential backoff
- **Network Issues**: Timeout handling and recovery

## Benefits

### Reliability
- **Single Service**: Consistent mail.tm API usage
- **API-Based**: No browser automation required for email checking
- **Error Recovery**: Graceful handling of service failures

### Performance
- **Fast Response**: Direct API calls for email operations
- **Efficient Polling**: Optimized OTP checking intervals
- **Resource Management**: No browser instances for email checking

### Monitoring
- **Provider Tracking**: Consistent mail.tm usage
- **Success Metrics**: Track OTP verification success rates
- **Debug Information**: Detailed logging for troubleshooting

## Usage

The system works transparently with existing Instagram account creation calls. No changes required to the API interface.

### Example Response
```javascript
{
  success: true,
  email: "user_123456_78901@somoj.com",
  emailProvider: "mailtm",
  emailFallbackUsed: false,
  username: "arjun_sharma_123456",
  // ... other account details
}
```

## Testing

The implementation includes comprehensive testing:
- ✅ Mail.tm API connectivity
- ✅ Domain fetching and selection
- ✅ Account creation and authentication
- ✅ Message retrieval and parsing
- ✅ OTP extraction patterns
- ✅ Error handling mechanisms

## Future Enhancements

1. **Domain Caching**: Cache domain lists for faster startup
2. **Token Management**: Implement token refresh mechanisms
3. **Rate Limiting**: Implement API rate limiting
4. **Health Monitoring**: Track API service reliability
5. **Alternative Domains**: Add support for multiple domain selection

## Conclusion

This implementation provides a reliable, API-based email service for Instagram account creation using mail.tm exclusively. The system offers consistent performance and detailed monitoring for optimal account creation success rates.