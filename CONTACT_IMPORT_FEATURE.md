# Contact Import Feature

## Overview

The Contact Import feature allows users to easily add multiple contacts to their SMS, WhatsApp, and Email campaigns. This feature provides two main methods for adding contacts:

1. **File Import** - Upload CSV/Excel files with contact data
2. **Direct Entry** - Manually add individual contacts

## Features

### File Import
- **Supported Formats**: CSV, Excel (.xlsx, .xls)
- **Validation**: Automatic validation of email addresses and phone numbers
- **Error Reporting**: Detailed error messages for invalid entries
- **Sample Files**: Downloadable sample files for each platform

### Direct Entry
- **Form-based**: Easy-to-use form for adding individual contacts
- **Real-time Validation**: Immediate feedback on data validity
- **Duplicate Detection**: Prevents adding duplicate contacts

### Platform-Specific Requirements

#### Email Campaigns
- **Required**: Valid email address
- **Optional**: Phone number, company, group, tags
- **Sample File**: `sample-contacts-email.csv`

#### SMS Campaigns
- **Required**: Valid phone number (7-15 digits)
- **Optional**: Email address, company, group, tags
- **Sample File**: `sample-contacts-sms.csv`

#### WhatsApp Campaigns
- **Required**: Valid phone number (7-15 digits)
- **Optional**: Email address, company, group, tags
- **Sample File**: `sample-contacts-whatsapp.csv`

## File Format

### CSV Structure

#### For Email Campaigns
```csv
Name,Email,Company,Group,Tags
John Doe,john@example.com,ABC Corp,General,important;vip
Jane Smith,jane@example.com,XYZ Inc,Customers,newsletter
```

#### For SMS/WhatsApp Campaigns
```csv
Name,Phone,Mobile,Email,Company,Group,Tags
John Doe,+1234567890,+1234567890,john@example.com,ABC Corp,General,important;vip
Jane Smith,+1987654321,+1987654321,jane@example.com,XYZ Inc,Customers,newsletter
```

### Field Descriptions

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Full name of the contact |
| Email | Yes (Email campaigns) | Valid email address |
| Phone | Yes (SMS/WhatsApp) | Primary phone number |
| Mobile | No | Alternative phone number |
| Company | No | Company or organization name |
| Group | No | Contact group/category (default: "General") |
| Tags | No | Semicolon-separated tags |

## Usage

### 1. Access Import Feature
- Navigate to SMS, WhatsApp, or Email campaign page
- Click "Import Contacts" button in the "Select Recipients" section

### 2. File Import
1. Click "Choose File" to select your CSV/Excel file
2. The system will automatically validate and process the file
3. Review any validation errors
4. Click "Add X Contacts to Campaign" to add valid contacts

### 3. Direct Entry
1. Switch to "Add Direct" tab
2. Fill in the contact form
3. Click "Add Contact" to add individual contacts
4. Repeat for additional contacts

### 4. Apply Contacts
- Click "Add X Contacts to Campaign" to add all imported/direct contacts
- Contacts are automatically saved to your contact database
- Contacts are added to your current campaign selection

## Validation Rules

### Email Validation
- Must contain @ symbol
- Must have valid domain format
- Must not be empty

### Phone Number Validation
- Must be 7-15 digits
- Can include +, spaces, dashes, parentheses
- International format supported

### Name Validation
- Must not be empty
- Must be trimmed of whitespace

## Error Handling

### File Import Errors
- Invalid file format
- Missing required fields
- Invalid data formats
- Duplicate contacts

### Direct Entry Errors
- Missing required fields
- Invalid email/phone format
- Duplicate contact detection

## API Endpoints

### Import Contacts
```
POST /api/contacts/import
```

**Request Body:**
```json
{
  "contacts": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "company": "ABC Corp",
      "group": "General",
      "tags": ["important", "vip"]
    }
  ],
  "userId": "user123",
  "saveToContacts": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully processed 5 contacts",
  "contacts": [...],
  "totalProcessed": 5,
  "savedCount": 5,
  "duplicateCount": 0,
  "errors": []
}
```

## Sample Files

### Email Sample (`/public/sample-contacts-email.csv`)
```csv
Name,Email,Company,Group,Tags
John Doe,john@example.com,ABC Corp,General,important;vip
Jane Smith,jane@example.com,XYZ Inc,Customers,newsletter
Mike Johnson,mike@example.com,Tech Solutions,Vendors,priority
Sarah Wilson,sarah@example.com,Marketing Pro,Partners,premium
David Brown,david@example.com,Consulting Co,General,regular
```

### SMS/WhatsApp Sample (`/public/sample-contacts-sms.csv`)
```csv
Name,Phone,Mobile,Email,Company,Group,Tags
John Doe,+1234567890,+1234567890,john@example.com,ABC Corp,General,important;vip
Jane Smith,+1987654321,+1987654321,jane@example.com,XYZ Inc,Customers,newsletter
Mike Johnson,+1555123456,+1555123456,mike@example.com,Tech Solutions,Vendors,priority
Sarah Wilson,+1444567890,+1444567890,sarah@example.com,Marketing Pro,Partners,premium
David Brown,+1777888999,+1777888999,david@example.com,Consulting Co,General,regular
```

## Benefits

1. **Efficiency**: Import hundreds of contacts at once
2. **Accuracy**: Automatic validation prevents errors
3. **Flexibility**: Both file import and manual entry options
4. **Integration**: Seamlessly integrates with existing contact system
5. **User-Friendly**: Clear error messages and sample files

## Technical Implementation

### Components
- `ContactImport` - Main import component
- `ContactSelector` - Existing contact selection component

### API Integration
- `/api/contacts/import` - Bulk import endpoint
- `/api/contacts` - Existing contacts management

### Database
- Contacts are saved to MongoDB
- Duplicate detection based on email/phone
- Automatic validation before saving

## Future Enhancements

1. **Excel Support**: Better Excel file parsing
2. **Bulk Operations**: Edit/delete multiple contacts
3. **Import History**: Track import operations
4. **Advanced Validation**: Custom validation rules
5. **Export**: Export contact lists in various formats 