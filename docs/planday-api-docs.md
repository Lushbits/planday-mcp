# Planday API Documentation - Complete Reference

## Getting Started

### Overview

Welcome to Planday! This API documentation will help you build powerful integrations to Planday using our REST API. Here's how to get started:

#### 1. Get Started with Planday
- **Request a demo portal** for development and testing by filling out [this form](https://forms.gle/D8eASsTeJGKCoNYd7)

#### 2. Learn About API Basics
- **Authentication**: Access is secured by standard OAuth2 flow with bearer token
- **Data Format**: All request and response data must be in JSON format
- **API Structure**: Separated into several domains (HR, Absence, etc.)
- **Pagination**: Most endpoints return max 50 records per page with offset handling
- **Postman Collection**: Request it by emailing [apisupport@planday.com](mailto:apisupport@planday.com)

#### 3. Set Up Your Test App
- Navigate to Settings → API access in your portal
- Use "Create app" button to create development application
- Choose appropriate scopes (cannot be added later, so choose all if unsure)
- Authorize the app on the portal
- Use the [Set Up Your Business guide](https://help.planday.com/en/articles/3702459-getting-started-set-up-your-business) to customize your portal

#### 4. Become a Certified Partner
For integrations intended for general availability (not custom integrations):
- Fill out [this form](https://forms.gle/rxFxAr6qV44X19aD7)
- Partnership manager will contact you for a demo
- Show integration setup process and functionality

---

## Authorization

### OAuth2 Protocol
Planday API uses standard OAuth2 protocol with Authorization Code flow. You need to:
1. Create an API application in Planday
2. Authorize the application for each portal where integration will access data

### Authorization Flow Types

#### For Customers (Direct Integration)
Use this approach when customers will connect your integration manually via Planday Settings.

**Step 1: Create Application**
- Navigate to Settings > Integrations > API Access (Administrator access required)
- Click "Create app" and configure settings
- Note down Client ID

**Step 2: Authorize Application**
- Select "Authorize" next to your application
- Review consent screen carefully
- Confirm access to all listed resources
- Click "Authorize"

**Step 3: Get Access Credentials**
You'll need:
- **Client ID**: From your application settings
- **Refresh Token**: Generated after authorization

#### For Product Partners
Use this approach for integrations available to multiple mutual customers.

**Prerequisites:**
- Contact [apisupport@planday.com](mailto:apisupport@planday.com) for demo account access
- Create application in demo portal following same steps as customers
- Implement authorization code flow for customer portals

### Authorization Code Flow

#### Step 1: Redirect User to Authorization URL
```
https://id.planday.com/connect/authorize?client_id={clientId}&response_type=code&redirect_uri={redirectUri}&scope={scopes}&state={state}
```

**Parameters:**
- `client_id` [Required]: Your APP ID from API Access page
- `redirect_uri` [Required]: URL-encoded redirect URL (up to 3 URLs allowed)
- `response_type` [Required]: Must be "code"
- `scope` [Required]: Space-separated list including "openid offline_access" plus your API scopes
- `state` [Optional]: Unique value for CSRF protection

**Example:**
```bash
curl --location --request GET 'https://id.planday.com/connect/authorize?client_id=f2370889-3ffe-46b6-83e7-1a20f5a20d2f&scope=openid%20offline_access%20employee:read&redirect_uri=http://example.com/code&response_type=code&state=xyzABC123'
```

#### Step 2: Handle Redirect Response
After user authorization, Planday redirects to your URL with:
```
{redirectURL}?code={code}&state={state}
```

#### Step 3: Exchange Code for Tokens
**Request:**
```
POST https://id.planday.com/connect/token
Content-Type: application/x-www-form-urlencoded

client_id={applicationId}&grant_type=authorization_code&code={code}&redirect_uri=https://myapp.com/redirect
```

**Response:**
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjgyQjU1OEI2NDA3QTkwRTlCRjIzMzYyQUM2M0E3NTdDMjNFQ0FC",
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjgyQjU1OEI2NDA3QTkwRTlCRjIzMzYyQUM2M0E3NTdDMjNFQ0FCM",
  "expires_in": 3600,
  "token_type": "Bearer",
  "refresh_token": "VxLtcy_OWkWoPKqs4uFhTg",
  "scope": "openid shift:read offline_access"
}
```

### Getting Access Tokens

#### Exchange Refresh Token for Access Token
```bash
curl -X POST \
--data "client_id=CLIENT_ID&grant_type=refresh_token&refresh_token=TOKEN" \
https://id.planday.com/connect/token
```

#### Making API Requests
Every API request must include these headers:
```
X-ClientId: CLIENT_ID
Authorization: Bearer ACCESS_TOKEN
```

**Example API Call:**
```bash
curl -X GET \
-H "Authorization: Bearer ACCESS_TOKEN" \
-H "X-ClientId: CLIENT_ID" \
https://openapi.planday.com/hr/v1/Departments
```

### Token Revocation
To disconnect/revoke access:
```
POST https://id.planday.com/connect/revocation
Content-Type: application/x-www-form-urlencoded

client_id={yourAppId}&token={refreshToken}
```

---

## Rate Limiting

### Rate Limit Rules
| Limit Bucket | Per Portal Limit | Per Client-ID Limit |
|--------------|------------------|---------------------|
| Per Second   | 20 requests      | 100 requests        |
| Per Minute   | 750 requests     | 2000 requests       |

- Exceeding limits results in HTTP 429 response
- Do not retry until rate limit counter resets
- Each request counts against both portal and client-id limits

### Rate Limit Headers
| HTTP Header | Description |
|-------------|-------------|
| `x-ratelimit-reset` | Seconds until counter resets |
| `x-ratelimit-remaining` | Remaining requests in current window |
| `x-ratelimit-limit` | Current limit quotas |

### Examples

**Normal Request (within limits):**
```bash
$ curl -v 'https://openapi.planday.com/hr/v1/Departments' -H "Authorization: Bearer $token"
< HTTP/2 200
< x-ratelimit-limit: 100, 20;w=1, 750;w=60, 100;w=1, 2000;w=60
< x-ratelimit-remaining: 99
< x-ratelimit-reset: 1
```

**Rate Limited Request:**
```bash
$ curl -v 'https://openapi.planday.com/hr/v1/Departments' -H "Authorization: Bearer $token"
< HTTP/2 429
< x-ratelimit-limit: 2000, 20;w=1, 750;w=60, 100;w=1, 2000;w=60
< x-ratelimit-remaining: 0
< x-ratelimit-reset: 33
```

---

## API Domains

### Absence API
**Purpose**: Manage Vacation and Overtime account types, balances, and transactions.

**Key Features:**
- Fetch/update Vacation and Overtime data
- Manage account balances
- Post transactions to employee accounts

### Contract Rules API
**Purpose**: Set contract rules on employees to ensure correct working hours.

**Note**: Does not support portals located in Australia.

### HR API
**Purpose**: Employee management and synchronization between Planday and other systems.

**Key Features:**
- Sync employee details
- Manage employee data
- Department management

### Pay API
**Purpose**: Synchronize employees' pay rates and salaries.

**Key Features:**
- Manage pay rates
- Handle salary information
- Pay structure management

### Payroll API
**Purpose**: Provide detailed payroll information for integration with payroll systems.

**Key Features:**
- Detailed payroll data
- Integration support for payroll systems
- Reporting tools integration

### Portal API
**Purpose**: Get basic details about the Planday portal you're connecting to.

**Key Features:**
- Portal information
- Basic portal details
- Connection verification

### Punchclock API
**Purpose**: Integrate with Planday's punch clock system.

**Key Features:**
- Read clock in/out entries
- Create clock entries
- Punch clock integration

### Reports API
**Purpose**: Get shift information as reports including details, approval status, and breaks.

**Key Features:**
- Shift reports
- Approval status tracking
- Break information
- Detailed shift data

### Revenue API
**Purpose**: Update revenue data in Planday for manager insights.

**Key Features:**
- Revenue updates
- Revenue vs scheduled cost insights
- Management reporting support

---

## Support and Resources

### Contact Information
- **API Support**: [apisupport@planday.com](mailto:apisupport@planday.com)
- **Partnership Inquiries**: Use the partnership form mentioned in getting started

### Useful Links
- **API Documentation**: [https://openapi.planday.com/](https://openapi.planday.com/)
- **Demo Portal Request**: [Form Link](https://forms.gle/D8eASsTeJGKCoNYd7)
- **Partnership Application**: [Form Link](https://forms.gle/rxFxAr6qV44X19aD7)
- **Business Setup Guide**: [Planday Help](https://help.planday.com/en/articles/3702459-getting-started-set-up-your-business)

### Best Practices
1. Always handle rate limiting appropriately
2. Use proper error handling for OAuth flows
3. Securely store refresh tokens
4. Implement proper CSRF protection with state parameters
5. Choose minimal required scopes for production applications
6. Test thoroughly in demo portal before production deployment