# K6 Dashboard Backend API Documentation

## Overview

The K6 Dashboard Backend follows Clean Architecture principles and provides RESTful APIs for managing performance tests and results.

## Base URL
```
http://localhost:4000
```

## Authentication
Currently, the API doesn't require authentication, but custom tokens can be provided for K6 test execution.

## Endpoints

### Health Check

#### GET /health
Returns the health status of the application.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2023-05-21T18:51:06.123Z",
  "uptime": 3600.5
}
```

### Test Management

#### GET /api/tests
Returns all available tests.

**Response:**
```json
[
  {
    "name": "load-test",
    "description": "Load Test",
    "file": "/path/to/tests/load-test.js"
  }
]
```

### Test Execution

#### POST /api/run/test
Executes a single test.

**Request Body:**
```json
{
  "test": "load-test",
  "profile": "LIGHT",
  "environment": "PROD",
  "customToken": "optional-bearer-token",
  "testId": "optional-custom-id"
}
```

**Response:**
```json
{
  "message": "Test started successfully",
  "testId": "load-test-1234567890",
  "config": {
    "test": "load-test",
    "profile": "LIGHT",
    "environment": "PROD",
    "hasCustomToken": true
  }
}
```

#### POST /api/run/all
Executes all tests sequentially.

**Request Body:**
```json
{
  "profile": "MEDIUM",
  "environment": "DEV",
  "customToken": "optional-bearer-token"
}
```

#### POST /api/run/stop
Stops a running test.

**Request Body:**
```json
{
  "testId": "load-test-1234567890"
}
```

#### GET /api/run/status
Returns currently running tests.

**Response:**
```json
{
  "runningTests": ["load-test-1234567890"],
  "count": 1
}
```

### Test Results

#### GET /api/results
Returns all test result directories.

**Response:**
```json
[
  {
    "name": "sequential_20230521_185106",
    "path": "/path/to/results/sequential_20230521_185106",
    "date": "2023-05-21T18:51:06.000Z",
    "type": "directory"
  }
]
```

#### GET /api/results/:directory
Returns test files in a specific directory.

**Response:**
```json
[
  {
    "name": "load-test.json",
    "path": "/path/to/results/sequential_20230521_185106/load-test.json"
  }
]
```

#### GET /api/results/:directory/:file
Returns specific test result data.

**Response:** Raw JSON test result from K6.

## WebSocket Events

### Client → Server

#### test_request
Debug event for test execution feedback.
```json
{
  "test": "load-test",
  "profile": "LIGHT",
  "environment": "PROD",
  "testId": "test-123"
}
```

#### stop_test
Request to stop a running test.
```json
{
  "testId": "test-123"
}
```

### Server → Client

#### connection_established
Sent when WebSocket connection is established.
```json
{
  "message": "WebSocket connection established successfully",
  "socketId": "abc123",
  "timestamp": "2023-05-21T18:51:06.123Z"
}
```

#### testOutput
Live test execution output.
```json
{
  "type": "log|error|complete|stopped",
  "data": "Test output message",
  "testId": "test-123",
  "timestamp": "2023-05-21T18:51:06.123Z"
}
```

#### resultsUpdated
Notification when new test results are available.
```json
{
  "message": "New test results available",
  "testName": "load-test",
  "resultFile": "results/20230521_185106_load-test.json",
  "timestamp": "2023-05-21T18:51:06.123Z"
}
```

## Error Handling

All errors follow this format:
```json
{
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "2023-05-21T18:51:06.123Z",
  "path": "/api/tests"
}
```

### Common Status Codes
- `200` - Success
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (test already running)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error


