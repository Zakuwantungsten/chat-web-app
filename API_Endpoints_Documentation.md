# API Endpoints Documentation
## Chat Web Application - Complete REST API Reference

**Base URL:** `http://localhost:5000/api` (Development)  
**API Version:** 1.0  
**Last Updated:** January 8, 2026

---

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

### Token Structure
```json
{
  "id": 1,
  "username": "john_doe",
  "role": "student",
  "iat": 1706544000,
  "exp": 1706630400
}
```

---

## 📚 API Endpoints Overview

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | User login | No |
| POST | `/auth/logout` | User logout | Yes |
| GET | `/auth/me` | Get current user info | Yes |

### User Management Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/profile` | Get current user profile | Yes |
| PUT | `/users/profile` | Update user profile | Yes |
| PUT | `/users/status` | Update online status | Yes |
| GET | `/users/` | Get all users | Yes |
| GET | `/users/class/:className` | Get users by class | Yes |

### Chat Room Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/chatrooms` | Get user's chat rooms | Yes |
| POST | `/chatrooms` | Create new chat room | Yes |
| GET | `/chatrooms/:id` | Get chat room details | Yes |
| PUT | `/chatrooms/:id` | Update chat room | Yes |
| DELETE | `/chatrooms/:id` | Delete chat room | Yes |
| POST | `/chatrooms/:id/join` | Join chat room | Yes |
| DELETE | `/chatrooms/:id/leave` | Leave chat room | Yes |
| GET | `/chatrooms/search` | Search public rooms | Yes |

### Message Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/messages/:roomId` | Get room messages | Yes |
| POST | `/messages/:roomId/send` | Send new message | Yes |
| POST | `/messages/:roomId/read` | Mark messages as read | Yes |
| GET | `/messages/:roomId/search` | Search messages in room | Yes |
| PUT | `/messages/edit/:messageId` | Edit message | Yes |
| DELETE | `/messages/:messageId` | Delete message | Yes |

### File Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/files/upload` | Upload file | Yes |
| GET | `/files/:id` | Download/view file | Yes |
| DELETE | `/files/:id` | Delete file | Yes |

### Notification Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/notifications` | Get user notifications | Yes |
| GET | `/notifications/unread-count` | Get unread count | Yes |
| PUT | `/notifications/:id/read` | Mark as read | Yes |
| PUT | `/notifications/mark-all-read` | Mark all as read | Yes |
| DELETE | `/notifications/:id` | Delete notification | Yes |

---

## 🔑 Authentication API

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@university.edu",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "studentId": "STU001",
  "role": "student"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@university.edu",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "studentId": "STU001",
      "avatar": null,
      "createdAt": "2026-01-26T10:00:00.000Z"
    }
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "field": "email",
      "message": "Email already exists"
    }
  ]
}
```

**Validation Rules:**
- Username: 3-50 characters, unique, alphanumeric with underscores
- Email: Valid email format, unique
- Password: Minimum 6 characters
- Role: student, class_rep, or admin (default: student)

---

### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@university.edu",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "isOnline": true
    }
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

## 👤 User Management API

### GET /api/users/profile
Get current authenticated user's profile.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@university.edu",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "studentId": "STU001",
    "avatar": "/uploads/avatars/avatar123.jpg",
    "bio": "Computer Science student interested in web development",
    "isOnline": true,
    "lastSeen": "2026-01-26T10:30:00.000Z",
    "createdAt": "2026-01-01T09:00:00.000Z"
  }
}
```

---

### PUT /api/users/profile
Update current user's profile information.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "firstName": "Johnathan",
  "lastName": "Doe",
  "bio": "Senior CS student passionate about full-stack development",
  "avatar": "/uploads/avatars/new-avatar.jpg"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "username": "john_doe",
    "firstName": "Johnathan",
    "lastName": "Doe",
    "bio": "Senior CS student passionate about full-stack development",
    "avatar": "/uploads/avatars/new-avatar.jpg"
  }
}
```

---

### GET /api/users/
Get all users in the system.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@university.edu",
      "role": "student",
      "studentId": "STU001",
      "avatar": "/uploads/avatars/avatar123.jpg",
      "isOnline": true,
      "lastSeen": "2026-01-08T10:30:00.000Z"
    },
    {
      "id": 2,
      "username": "classrep",
      "firstName": "John",
      "lastName": "Representative",
      "email": "classrep@student.edu",
      "role": "class_rep",
      "studentId": "CR001",
      "avatar": null,
      "isOnline": false,
      "lastSeen": "2026-01-08T09:15:00.000Z"
    }
  ],
  "count": 2
}
```

---

### PUT /api/users/status
Update user's online status.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "isOnline": true
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Status updated successfully",
  "data": {
    "id": 1,
    "isOnline": true,
    "lastSeen": "2026-01-08T10:30:00.000Z"
  }
}
```

---

### GET /api/users/class/:className
Get all users from a specific class.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Parameters:**
- `className` (path): Class name to filter by

**Example Request:**
```
GET /api/users/class/Computer%20Science%202024
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@university.edu",
      "role": "student",
      "class": "Computer Science 2024",
      "studentId": "STU001",
      "avatar": "/uploads/avatars/avatar123.jpg",
      "isOnline": true
    }
  ],
  "count": 1
}
```

---

## 💬 Chat Room API

### GET /api/chatrooms
Get all chat rooms for the current user.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `type` (optional): Filter by room type (group, direct, class, subject)
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example Request:**
```
GET /api/chatrooms?type=group&limit=20
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "CS101 Class Chat",
      "description": "Main class discussion group",
      "type": "class",
      "privacy": "public",
      "memberCount": 45,
      "createdBy": {
        "id": 2,
        "username": "class_rep_01",
        "role": "class_rep"
      },
      "userRole": "member",
      "lastMessage": {
        "content": "Assignment due tomorrow!",
        "createdAt": "2026-01-26T09:30:00.000Z",
        "sender": "class_rep_01"
      },
      "unreadCount": 3,
      "isMuted": false,
      "createdAt": "2026-01-01T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### POST /api/chatrooms
Create a new chat room.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "name": "Web Development Study Group",
  "description": "Discussion group for web dev projects and homework",
  "type": "subject",
  "privacy": "public",
  "settings": {
    "allowFileSharing": true,
    "maxFileSize": 10485760,
    "allowedFileTypes": ["image", "document", "video"]
  }
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Chat room created successfully",
  "data": {
    "id": 15,
    "name": "Web Development Study Group",
    "description": "Discussion group for web dev projects and homework",
    "type": "subject",
    "privacy": "public",
    "createdBy": 1,
    "memberCount": 1,
    "settings": {
      "allowFileSharing": true,
      "maxFileSize": 10485760,
      "allowedFileTypes": ["image", "document", "video"]
    },
    "createdAt": "2026-01-26T11:00:00.000Z"
  }
}
```

---

### POST /api/chatrooms/:id/join
Join an existing chat room.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Parameters:**
- `id` (path): Chat room ID

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Successfully joined chat room",
  "data": {
    "chatRoomId": 15,
    "userId": 1,
    "role": "member",
    "joinedAt": "2026-01-26T11:05:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Already a member of this chat room"
}
```

---

## 📨 Message API

### GET /api/messages/:roomId
Get messages for a specific chat room.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Parameters:**
- `roomId` (path): Chat room ID

**Query Parameters:**
- `limit` (optional): Number of messages (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `before` (optional): Get messages before timestamp

**Example Request:**
```
GET /api/messages/1?limit=20&offset=0
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "chatRoomId": 1,
      "content": "Hey everyone! Don't forget about the assignment due tomorrow.",
      "messageType": "text",
      "sender": {
        "id": 2,
        "username": "class_rep_01",
        "firstName": "Sarah",
        "lastName": "Johnson",
        "avatar": "/uploads/avatars/avatar2.jpg"
      },
      "file": null,
      "replyTo": null,
      "isEdited": false,
      "createdAt": "2026-01-26T09:30:00.000Z",
      "updatedAt": "2026-01-26T09:30:00.000Z"
    },
    {
      "id": 124,
      "chatRoomId": 1,
      "content": "I've attached the lecture notes for reference.",
      "messageType": "file",
      "sender": {
        "id": 2,
        "username": "class_rep_01",
        "firstName": "Sarah",
        "lastName": "Johnson",
        "avatar": "/uploads/avatars/avatar2.jpg"
      },
      "file": {
        "id": 45,
        "filename": "lecture-notes-1706283600000-123456789.pdf",
        "originalName": "Lecture_Notes_Week3.pdf",
        "mimetype": "application/pdf",
        "size": 2457600,
        "downloadUrl": "/api/files/45"
      },
      "replyTo": null,
      "isEdited": false,
      "createdAt": "2026-01-26T09:31:00.000Z",
      "updatedAt": "2026-01-26T09:31:00.000Z"
    }
  ],
  "count": 2,
  "hasMore": true
}
```

---

### POST /api/messages/:roomId/send
Send a new message to a chat room.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Parameters:**
- `roomId` (path): Chat room ID

**Request Body:**
```json
{
  "content": "Thank you for the notes!",
  "messageType": "text",
  "fileId": null,
  "replyTo": 124
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": 125,
    "chatRoomId": 1,
    "senderId": 1,
    "content": "Thank you for the notes!",
    "messageType": "text",
    "replyTo": 124,
    "createdAt": "2026-01-26T09:35:00.000Z",
    "sender": {
      "id": 1,
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "/uploads/avatars/avatar123.jpg"
    }
  }
}
```

---

### POST /api/messages/:roomId/read
Mark messages as read in a chat room.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Parameters:**
- `roomId` (path): Chat room ID

**Request Body:**
```json
{
  "lastReadMessageId": 125
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Messages marked as read",
  "data": {
    "chatRoomId": 1,
    "lastReadMessageId": 125,
    "updatedAt": "2026-01-08T09:40:00.000Z"
  }
}
```

---

### GET /api/messages/:roomId/search
Search messages within a specific chat room.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Parameters:**
- `roomId` (path): Chat room ID

**Query Parameters:**
- `q` (required): Search query string
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example Request:**
```
GET /api/messages/1/search?q=assignment&limit=20
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "chatRoomId": 1,
      "content": "Don't forget about the assignment due tomorrow.",
      "messageType": "text",
      "sender": {
        "id": 2,
        "username": "class_rep_01",
        "firstName": "Sarah",
        "lastName": "Johnson"
      },
      "createdAt": "2026-01-08T09:30:00.000Z"
    }
  ],
  "count": 1,
  "query": "assignment"
}
```

---

### PUT /api/messages/edit/:messageId
Edit an existing message (must be message sender).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Parameters:**
- `messageId` (path): Message ID

**Request Body:**
```json
{
  "content": "Thank you so much for the notes!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Message updated successfully",
  "data": {
    "id": 125,
    "content": "Thank you so much for the notes!",
    "isEdited": true,
    "editedAt": "2026-01-26T09:40:00.000Z"
  }
}
```

---

### DELETE /api/messages/:messageId
Delete a message (soft delete).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Parameters:**
- `id` (path): Message ID

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

**Note:** Messages are soft-deleted (isDeleted flag set to true). Only the sender or room admin can delete messages.

---

## 📎 File API

### POST /api/files/upload
Upload a file with optional message attachment.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
file: [binary file data]
chatRoomId: 1
messageContent: "Here's the project document"
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "file": {
      "id": 46,
      "filename": "project-doc-1706283600000-987654321.pdf",
      "originalName": "CS101_Project_Proposal.pdf",
      "mimetype": "application/pdf",
      "size": 1234567,
      "path": "/uploads/files/2026/01/project-doc-1706283600000-987654321.pdf",
      "uploadedBy": 1,
      "createdAt": "2026-01-26T10:00:00.000Z"
    },
    "message": {
      "id": 126,
      "chatRoomId": 1,
      "senderId": 1,
      "content": "Here's the project document",
      "messageType": "file",
      "fileId": 46,
      "createdAt": "2026-01-26T10:00:00.000Z"
    }
  }
}
```

**File Restrictions:**
- Maximum size: 50MB for videos, 10MB for documents, 5MB for images
- Allowed types: Images (JPG, PNG, GIF), Videos (MP4, WebM), Documents (PDF, DOC, DOCX, TXT)

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "File too large",
  "details": {
    "maxSize": 10485760,
    "actualSize": 15728640,
    "fileType": "document"
  }
}
```

---

### GET /api/files/:id
Download or view a file.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Parameters:**
- `id` (path): File ID

**Query Parameters:**
- `download` (optional): Set to 'true' to force download (default: false)

**Success Response (200 OK):**
Returns the file with appropriate Content-Type header.

**Headers:**
```
Content-Type: [file mime type]
Content-Disposition: inline; filename="original_filename.ext"
Content-Length: [file size]
```

**For Download:**
```
Content-Disposition: attachment; filename="original_filename.ext"
```

---

### DELETE /api/files/:id
Delete a file (must be uploader or admin).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Parameters:**
- `id` (path): File ID

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "error": "You don't have permission to delete this file"
}
```

---

## 🔔 Notification API

### GET /api/notifications
Get notifications for the current user.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `unread` (optional): Filter unread notifications (true/false)
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 1,
      "type": "mention",
      "title": "You were mentioned",
      "content": "@john_doe check out this resource!",
      "data": {
        "messageId": 127,
        "chatRoomId": 1,
        "mentionedBy": {
          "id": 3,
          "username": "jane_smith"
        }
      },
      "isRead": false,
      "createdAt": "2026-01-08T11:00:00.000Z"
    },
    {
      "id": 2,
      "userId": 1,
      "type": "room_invite",
      "title": "Room Invitation",
      "content": "You've been invited to join 'Advanced Programming Study Group'",
      "data": {
        "chatRoomId": 12,
        "invitedBy": {
          "id": 2,
          "username": "class_rep_01"
        }
      },
      "isRead": false,
      "createdAt": "2026-01-08T10:45:00.000Z"
    }
  ],
  "count": 2,
  "unreadCount": 2
}
```

---

### GET /api/notifications/unread-count
Get count of unread notifications for the current user.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

---

### PUT /api/notifications/:notificationId/read
Mark notification as read.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Parameters:**
- `notificationId` (path): Notification ID

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": 1,
    "isRead": true,
    "readAt": "2026-01-08T11:05:00.000Z"
  }
}
```

---

### PUT /api/notifications/mark-all-read
Mark all notifications as read for the current user.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "updatedCount": 5
  }
}
```

---

### DELETE /api/notifications/:notificationId
Delete a notification.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Parameters:**
- `notificationId` (path): Notification ID

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

## 🔌 WebSocket Events (Socket.io)

### Client → Server Events

#### Connection & Authentication
```javascript
// Connect to Socket.io server
const socket = io('http://localhost:5000', {
  auth: {
    token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
});

// Listen for authentication success
socket.on('authenticated', (data) => {
  console.log('Authenticated:', data);
});
```

#### Join/Leave Room
```javascript
// Join a chat room
socket.emit('join_room', {
  roomId: 1
});

// Leave a chat room
socket.emit('leave_room', {
  roomId: 1
});
```

#### Send Message
```javascript
// Send a message
socket.emit('send_message', {
  roomId: 1,
  content: 'Hello everyone!',
  messageType: 'text'
});
```

#### Typing Indicators
```javascript
// Start typing
socket.emit('typing_start', {
  roomId: 1
});

// Stop typing
socket.emit('typing_stop', {
  roomId: 1
});
```

---

### Server → Client Events

#### Receive Message
```javascript
socket.on('message_received', (message) => {
  console.log('New message:', message);
  // message structure same as REST API response
});
```

#### User Typing
```javascript
socket.on('user_typing', (data) => {
  console.log('User typing:', data);
  // { roomId: 1, user: { id: 2, username: 'john_doe' } }
});
```

#### User Status
```javascript
socket.on('user_online', (data) => {
  console.log('User came online:', data);
  // { userId: 2, username: 'john_doe' }
});

socket.on('user_offline', (data) => {
  console.log('User went offline:', data);
  // { userId: 2, username: 'john_doe' }
});
```

---

## ⚠️ Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": {
    // Additional error details
  },
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Status Code | Error Type | Description |
|------------|------------|-------------|
| 400 | Bad Request | Invalid request parameters or validation error |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions for the action |
| 404 | Not Found | Requested resource doesn't exist |
| 409 | Conflict | Resource conflict (e.g., duplicate username) |
| 413 | Payload Too Large | File upload exceeds size limit |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error occurred |

---

## 📊 Rate Limiting

All API endpoints are rate-limited to prevent abuse:

- **Authentication Endpoints:** 5 requests per minute
- **File Upload:** 10 requests per minute
- **Message Sending:** 30 requests per minute
- **Other Endpoints:** 100 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706283600
```

---

## 🔒 Security Best Practices

### For API Consumers:

1. **Token Storage:** Store JWT tokens securely (never in localStorage for sensitive apps)
2. **HTTPS Only:** Always use HTTPS in production
3. **Token Refresh:** Implement token refresh logic before expiration
4. **Input Validation:** Validate all user inputs on client side
5. **Error Handling:** Handle API errors gracefully
6. **File Validation:** Validate files before upload (type, size)

### API Security Features:

- JWT-based authentication with expiration
- Role-based access control (RBAC)
- Input sanitization and validation
- Rate limiting on all endpoints
- CORS configuration for allowed origins
- File upload validation (type, size)
- SQL injection prevention (ORM)
- XSS protection (input sanitization)

---

## 📖 Code Examples

### JavaScript/React Example
```javascript
// API Service Class
class ChatAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Get user profile
  async getProfile() {
    return this.request('/users/profile');
  }

  // Send message
  async sendMessage(roomId, content) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify({
        chatRoomId: roomId,
        content,
        messageType: 'text'
      })
    });
  }

  // Upload file
  async uploadFile(file, roomId, messageContent) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatRoomId', roomId);
    formData.append('messageContent', messageContent);

    return this.request('/files/upload', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  }
}

// Usage
const api = new ChatAPI('http://localhost:5000/api', userToken);

// Get profile
api.getProfile()
  .then(profile => console.log(profile))
  .catch(error => console.error(error));

// Send message
api.sendMessage(1, 'Hello!')
  .then(response => console.log('Message sent:', response))
  .catch(error => console.error(error));
```

---

This comprehensive API documentation provides complete reference for all endpoints in the Chat Web Application, including request/response formats, authentication, error handling, and practical code examples.