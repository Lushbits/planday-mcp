# Planday HR API - Custom Property Attachment Values

## Overview

The Planday HR API Custom Property Attachment Values endpoint provides support for custom fields with image values. You can manage employee custom field attachments with full CRUD operations. These custom fields allow storing additional employee information such as profile photos, document attachments, or other image-based data.

**Base URL:** `https://openapi.planday.com/hr/v1.0`

**Authentication:** All endpoints require OAuth2 authorization with appropriate scopes.

**Note:** Remember to use the GET employees field definitions endpoint to identify the attachment custom fields available in your portal.

---

## Data Model

### Custom Property Attachment Value

Custom property attachment values are stored as Base64-encoded data URI strings. The attachment data is encoded and can represent various image formats supported by the custom field configuration.

**Format:** Data URI encoded in Base64
**Content-Type:** Varies based on image type (e.g., `image/jpeg`, `image/png`)
**Response:** String containing the Base64-encoded attachment data

---

## Endpoints

### POST /employees/{employeeId}/customfields/{customPropertyName}/value - Create Attachment Value

Create an attachment value for a custom property.

**Required Scope:** `employee:create`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `employeeId` | integer | Required. The ID of the employee whose attachment value should be created |
| `customPropertyName` | string | Required. The name of the custom property (format: "custom_123456") |

#### Request Body

The request body should contain the attachment as a data URI encoded in Base64.

#### Example Request

```http
POST /hr/v1.0/employees/614517/customfields/custom_123456/value
Authorization: Bearer {access_token}
X-ClientId: {client_id}
Content-Type: application/json

"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlCnuBuKj78eYNy9FPRNbVNOGRF7d6VvxGRslpMa3GHrxFhEQQPaOOZgn4MkaYbTp8aMWLJvlBsSlk8xOmNBwlf8EAY7K1ZWAa6x4v/ACZJePGKY6JKKjGIKz+I5yJgJhGBgD0XNSu"
```

#### Response

```json
"string"
```

---

### GET /employees/{employeeId}/customfields/{customPropertyName}/value - Get Attachment Value

Get the image attachment value for a custom field.

**Required Scope:** `employee:read`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `employeeId` | integer | Required. Employee ID (must be non-negative) |
| `customPropertyName` | string | Required. The identifier of the custom field (format: "custom_123456") |

#### Example Request

```http
GET /hr/v1.0/employees/614517/customfields/custom_123456/value
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```json
"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlCnuBuKj78eYNy9FPRNbVNOGRF7d6VvxGRslpMa3GHrxFhEQQPaOOZgn4MkaYbTp8aMWLJvlBsSlk8xOmNBwlf8EAY7K1ZWAa6x4v/ACZJePGKY6JKKjGIKz+I5yJgJhGBgD0XNSu"
```

---

### PUT /employees/{employeeId}/customfields/{customPropertyName}/value - Update Attachment Value

Update the attachment value for a custom property.

**Required Scope:** `employee:update`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `employeeId` | integer | Required. The ID of the employee whose attachment value should be updated |
| `customPropertyName` | string | Required. The name of the custom property |

#### Request Body

The request body should contain the updated attachment as a data URI encoded in Base64.

#### Example Request

```http
PUT /hr/v1.0/employees/614517/customfields/custom_123456/value
Authorization: Bearer {access_token}
X-ClientId: {client_id}
Content-Type: application/json

"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
```

#### Response

```json
"string"
```

---

### DELETE /employees/{employeeId}/customfields/{customPropertyName}/value - Delete Attachment Value

Delete the attachment value of a custom property.

**Required Scope:** `employee:update`

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `employeeId` | integer | Required. The ID of the employee whose attachment value should be deleted |
| `customPropertyName` | string | Required. The name of the custom property |

#### Example Request

```http
DELETE /hr/v1.0/employees/614517/customfields/custom_123456/value
Authorization: Bearer {access_token}
X-ClientId: {client_id}
```

#### Response

```json
true
```

---

## Usage Examples

### Upload Employee Profile Photo

```javascript
// Convert image file to Base64 data URI
function fileToDataURI(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Upload profile photo
async function uploadEmployeePhoto(employeeId, photoFile) {
  try {
    const dataURI = await fileToDataURI(photoFile);
    
    const response = await createCustomFieldAttachment(employeeId, 'custom_profile_photo', dataURI);
    console.log('Profile photo uploaded successfully');
    return response;
  } catch (error) {
    console.error('Failed to upload profile photo:', error.message);
    throw error;
  }
}

// Usage
const photoFile = document.getElementById('photoInput').files[0];
await uploadEmployeePhoto(614517, photoFile);
```

### Retrieve and Display Employee Photo

```javascript
// Get employee photo and display in UI
async function displayEmployeePhoto(employeeId, customFieldName, imgElement) {
  try {
    const photoData = await getCustomFieldAttachment(employeeId, customFieldName);
    
    if (photoData && photoData !== "string") {
      imgElement.src = photoData;
      imgElement.style.display = 'block';
    } else {
      imgElement.style.display = 'none';
      console.log('No photo available for employee');
    }
  } catch (error) {
    console.error('Failed to retrieve employee photo:', error.message);
    imgElement.style.display = 'none';
  }
}

// Usage
const imgElement = document.getElementById('employeePhoto');
await displayEmployeePhoto(614517, 'custom_profile_photo', imgElement);
```

### Update Employee Document

```javascript
// Update an existing employee document attachment
async function updateEmployeeDocument(employeeId, customFieldName, newDocumentFile) {
  try {
    // Convert new document to data URI
    const dataURI = await fileToDataURI(newDocumentFile);
    
    // Update the attachment
    const response = await updateCustomFieldAttachment(employeeId, customFieldName, dataURI);
    console.log('Employee document updated successfully');
    return response;
  } catch (error) {
    console.error('Failed to update employee document:', error.message);
    throw error;
  }
}
```

### Bulk Photo Management

```javascript
// Manage photos for multiple employees
class EmployeePhotoManager {
  constructor(customFieldName = 'custom_profile_photo') {
    this.customFieldName = customFieldName;
  }
  
  async uploadPhoto(employeeId, photoFile) {
    const dataURI = await fileToDataURI(photoFile);
    return await createCustomFieldAttachment(employeeId, this.customFieldName, dataURI);
  }
  
  async getPhoto(employeeId) {
    try {
      return await getCustomFieldAttachment(employeeId, this.customFieldName);
    } catch (error) {
      if (error.status === 404) {
        return null; // No photo exists
      }
      throw error;
    }
  }
  
  async updatePhoto(employeeId, photoFile) {
    const dataURI = await fileToDataURI(photoFile);
    return await updateCustomFieldAttachment(employeeId, this.customFieldName, dataURI);
  }
  
  async deletePhoto(employeeId) {
    return await deleteCustomFieldAttachment(employeeId, this.customFieldName);
  }
  
  async hasPhoto(employeeId) {
    const photo = await this.getPhoto(employeeId);
    return photo !== null && photo !== "string";
  }
}

// Usage example
const photoManager = new EmployeePhotoManager();

// Upload photos for multiple employees
const employeePhotos = [
  { employeeId: 614517, file: photo1File },
  { employeeId: 614518, file: photo2File },
  { employeeId: 614519, file: photo3File }
];

for (const { employeeId, file } of employeePhotos) {
  try {
    await photoManager.uploadPhoto(employeeId, file);
    console.log(`Photo uploaded for employee ${employeeId}`);
  } catch (error) {
    console.error(`Failed to upload photo for employee ${employeeId}:`, error.message);
  }
}
```

### Custom Field Discovery and Management

```javascript
// Discover available attachment custom fields
async function getAttachmentCustomFields() {
  const fieldDefinitions = await getEmployeeFieldDefinitions('Post');
  const attachmentFields = [];
  
  // Look for custom fields in the schema
  Object.keys(fieldDefinitions.data.properties).forEach(key => {
    if (key.startsWith('custom_')) {
      // This is a custom field - you may need additional logic to determine if it's an attachment type
      attachmentFields.push({
        name: key,
        definition: fieldDefinitions.data.properties[key]
      });
    }
  });
  
  return attachmentFields;
}

// Complete custom field attachment workflow
async function manageEmployeeAttachments(employeeId) {
  // Get available attachment fields
  const attachmentFields = await getAttachmentCustomFields();
  
  console.log(`Found ${attachmentFields.length} custom attachment fields`);
  
  // Check which fields have values for this employee
  const fieldStatus = {};
  
  for (const field of attachmentFields) {
    try {
      const value = await getCustomFieldAttachment(employeeId, field.name);
      fieldStatus[field.name] = {
        hasValue: value !== null && value !== "string",
        field: field
      };
    } catch (error) {
      fieldStatus[field.name] = {
        hasValue: false,
        field: field,
        error: error.message
      };
    }
  }
  
  return fieldStatus;
}

// Usage
const attachmentStatus = await manageEmployeeAttachments(614517);
console.log('Employee attachment status:', attachmentStatus);
```

---

## Error Responses

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Request completed successfully |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Application isn't assigned to the appropriate scope |
| 429 | Too Many Requests - Rate limit exceeded |

## Rate Limits

- **Per Portal**: 20 requests/second, 750 requests/minute
- **Per Client ID**: 100 requests/second, 2000 requests/minute

---

## Common Use Cases

### Employee Profile Management
Custom property attachments are commonly used for:
- **Profile Photos**: Store employee profile pictures for identification
- **Document Storage**: Attach important employee documents like contracts or certifications
- **ID Photos**: Store copies of employee identification documents
- **Signature Images**: Store employee signature images for document signing

### Compliance and Documentation
Use attachments for:
- **Certification Images**: Store photos of professional certifications
- **Training Certificates**: Attach completion certificates for required training
- **Safety Documents**: Store safety training documentation and photos
- **Emergency Contact Photos**: Visual identification for emergency contacts

### Integration Support
Attachment custom fields help with:
- **Badge Systems**: Store employee badge photos for access control integration
- **HR Systems**: Sync employee photos with external HR management systems
- **Directory Services**: Populate corporate directories with employee photos
- **Mobile Apps**: Provide photos for employee-facing mobile applications

---

## Integration Notes

- Custom property names follow the format "custom_123456" where the number is unique per field
- Attachments are stored as Base64-encoded data URIs
- File size limits may apply depending on portal configuration
- Supported image formats depend on custom field configuration
- Use the GET employees field definitions endpoint to discover available attachment fields
- Attachment data should be properly encoded before sending to the API

## Related Endpoints

- **Employees API**: Main employee management with custom field references
- **Employee Field Definitions**: Discover available custom fields and their types
- **Employee History**: Track changes to custom field attachments

---

## Best Practices

### Data Management
- Validate image file types and sizes before uploading
- Use appropriate image compression to minimize data transfer
- Implement proper error handling for upload failures
- Consider image optimization for better performance

### Security and Privacy
- Ensure proper access controls for sensitive employee attachments
- Validate file content to prevent malicious uploads
- Consider data retention policies for employee attachments
- Implement audit logging for attachment access and modifications

### Performance Optimization
- Cache attachment data when possible to reduce API calls
- Implement progressive loading for multiple employee photos
- Use appropriate image formats (JPEG for photos, PNG for documents)
- Consider implementing thumbnail generation for large images

### User Experience
- Provide visual feedback during upload/update operations
- Implement drag-and-drop interfaces for file uploads
- Show preview images before confirming uploads
- Provide clear error messages for upload failures