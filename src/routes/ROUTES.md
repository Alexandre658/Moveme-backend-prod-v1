# API Routes Documentation

This document provides a comprehensive overview of all available API routes in the system.

## Table of Contents
- [Authentication Routes](#authentication-routes)
- [Tracking Routes](#tracking-routes)
- [Request Routes](#request-routes)
- [Notification Routes](#notification-routes)
- [Peak Hour Routes](#peak-hour-routes)
- [Email Routes](#email-routes)

## Authentication Routes
Base path: `/auth`

Authentication endpoints for user management.

## Tracking Routes
Base path: `/trackings`

Vehicle tracking management endpoints.

### POST /trackings
Create or update a vehicle tracking.

**Request Body:**
```json
{
  "id": "123",
  "created": "2024-01-01T00:00:00Z",
  "startTime": "2024-01-01T00:10:00Z",
  "endTime": "2024-01-01T01:00:00Z",
  "status": "active",
  "position": {
    "latitude": -8.837,
    "longitude": 13.234
  },
  "vehicle": "Vehicle1",
  "classVehicle": "Car"
}
```

**Responses:**
- `201`: Tracking created or updated successfully
- `400`: Missing required parameters
- `500`: Error creating or updating tracking

### GET /trackings
Get all trackings.

**Responses:**
- `200`: List of all trackings
- `500`: Error getting trackings

### GET /trackings/{id}
Get a tracking by ID.

**Parameters:**
- `id` (path): Tracking ID

**Responses:**
- `200`: Tracking found
- `404`: Tracking not found
- `500`: Error getting tracking

### PUT /trackings/{id}
Update a tracking by ID.

**Parameters:**
- `id` (path): ID of the tracking to update

**Request Body:**
```json
{
  "created": "2024-01-01T00:00:00Z",
  "startTime": "2024-01-01T00:10:00Z",
  "endTime": "2024-01-01T01:00:00Z",
  "status": "active",
  "position": {
    "latitude": -8.837,
    "longitude": 13.234
  },
  "vehicle": "Vehicle1"
}
```

**Responses:**
- `200`: Tracking updated successfully
- `404`: Tracking not found
- `400`: Missing required parameters
- `500`: Error updating tracking

### DELETE /trackings/{id}
Delete a tracking by ID.

**Parameters:**
- `id` (path): ID of the tracking to delete

**Responses:**
- `200`: Tracking deleted successfully
- `404`: Tracking not found
- `500`: Error deleting tracking

## Peak Hour Routes
Base path: `/peak-hour`

Peak hour configuration and management endpoints.

### GET /peak-hour/status
Get peak hour status for a specific location.

### POST /peak-hour/config
Create or update peak hour configuration.

### DELETE /peak-hour/config
Remove peak hour configuration.

### Vehicle Classes
- GET /peak-hour/vehicle-classes
- GET /peak-hour/vehicle-classes/{id}
- POST /peak-hour/vehicle-classes
- DELETE /peak-hour/vehicle-classes/{id}

## Request Routes
Base path: `/requests`

Ride request management endpoints.

## Notification Routes
Base path: `/notifications`

Push notification management endpoints.

## Email Routes
Base path: `/api/email`

Email service management endpoints.

## WebSocket Events

The system also provides real-time communication through WebSocket events:

### Tracking Events
- `tracking_update`: Real-time vehicle tracking updates
- `ride_completed`: Notification when a ride is completed

### Peak Hour Events
- `peak_hour_status`: Current peak hour status updates
- `peak_hour_status_changed`: Notification when peak hour status changes

### Request Events
- `requestResponse`: Response to ride requests
- `driverArrived`: Notification when driver arrives
- `driverStartTheRace`: Notification when ride starts
- `rideFinished`: Notification when ride ends

### Call Events
- `call`: Initiate a call
- `endCall`: End a call
- `answer`: Answer a call
- `candidate`: WebRTC candidate information

## Rate Limiting

The API implements rate limiting for security:

- General endpoints: 1000 requests per minute per IP
- Tracking endpoints: 5000 requests per minute per IP

Trusted IPs can be configured to bypass rate limiting.

## Error Responses

All endpoints follow a standard error response format:

```json
{
  "error": "Error message description",
  "status": 400
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error 