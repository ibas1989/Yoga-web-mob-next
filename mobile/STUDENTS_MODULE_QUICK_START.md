# Students Module - Quick Start Guide

## Getting Started

The Students module is now fully implemented in your mobile app. Here's how to use it:

## Main Features

### 1. Viewing Students
- Open the app and navigate to the **Students** tab
- You'll see a list of all students with their:
  - Name and phone number
  - Current balance (color-coded)
- Use the **search bar** to find specific students
  - Search activates after typing 2+ characters
  - Search by student name

### 2. Creating a New Student
1. Tap the **"Create New"** button at the top of the Students list
2. Fill in the required information:
   - **Name** (required)
   - Phone, Weight, Height (optional)
   - Birthday, Member Since date (optional)
   - Description (optional)
   - Initial Balance (default: 0)
3. Select **goals** from the available options
4. Tap **"Create"** to save

### 3. Viewing Student Details
1. Tap on any student card in the list
2. View comprehensive information:
   - Personal details
   - Current balance
   - Goals and focus areas
   - Notes
   - Balance transaction history
   - Session history

### 4. Editing a Student
1. Open the student details screen
2. Tap the **pencil icon** in the header
3. Modify any fields
4. Tap **"Save"** to apply changes

### 5. Managing Student Notes
**Adding a Note:**
1. Open student details
2. In the Notes section, tap the **plus icon**
3. Enter your note content
4. Tap **"Save"**

**Deleting a Note:**
1. Find the note in the student details
2. Tap the **trash icon** on the note
3. Confirm deletion

### 6. Managing Balance Transactions
**Adding a Transaction:**
1. Open student details
2. Tap the **plus button** next to the balance
3. Enter:
   - **Amount** (positive to add sessions, negative to deduct)
   - **Reason** (e.g., "Purchased 10 sessions", "Attended individual class")
4. Tap **"Add Transaction"**
5. The student's balance will update automatically

**Understanding Balance:**
- **Red badge**: Student owes sessions (positive balance = debt)
- **Green badge**: Student has credit or good standing (zero/negative = prepaid)
- Example: Balance of +5 means student needs to pay for 5 sessions
- Example: Balance of -3 means student has 3 prepaid sessions

### 7. Deleting a Student
1. Open student details
2. Tap the **trash icon** in the header
3. Confirm deletion
4. **Warning**: This permanently deletes the student and all related data

## Navigation Structure

```
Students Tab
│
├── Create New Student (/student/new)
│   └── Fill form → Save → Returns to list
│
└── Student Card (tap)
    └── Student Details (/student/[id])
        ├── Edit Button → Edit Student (/student/[id]/edit)
        │   └── Save → Returns to details
        │
        ├── Delete Button → Confirm → Returns to list
        │
        ├── Add Note Button → Modal → Save → Refresh
        │
        └── Add Balance Button → Modal → Save → Refresh
```

## Tips and Best Practices

### Data Entry Tips
1. **Phone Numbers**: Include country code for international numbers
2. **Dates**: Use YYYY-MM-DD format (e.g., 2024-03-15)
3. **Weight/Height**: Use decimal numbers (e.g., 65.5 kg, 175 cm)
4. **Balance**: 
   - Positive numbers = student owes sessions
   - Negative numbers = student has prepaid sessions

### Search Tips
- Type at least 2 characters to activate search
- Search is case-insensitive
- Currently searches by name only
- Tap the X icon to clear search

### Balance Management Best Practices
1. **When student purchases sessions**: Add positive transaction
   - Example: +10 sessions for "Package purchase - March 2024"
2. **When student attends class**: Add negative transaction
   - Example: -1 for "Individual class - March 15"
3. **Keep reasons clear**: Include date and type for better tracking
4. **Review transaction history**: Check before manually adjusting

### Notes Best Practices
1. **Track progress**: "Improved flexibility in hamstrings"
2. **Record concerns**: "Complained of lower back pain"
3. **Set goals**: "Aiming to hold headstand for 30 seconds"
4. **Medical info**: "Recovering from knee surgery"
5. **Preferences**: "Prefers morning classes"

## Troubleshooting

### Students list is empty
- If you're starting fresh, create your first student
- Ensure the app has loaded (check for loading indicator)
- Try restarting the app

### Search not working
- Make sure you've typed at least 2 characters
- Check that the search term matches student names
- Clear search and try again

### Can't edit student
- Ensure you're on the details screen
- Tap the pencil icon in the header
- Check for any error messages

### Balance not updating
- Verify you entered a valid number
- Check that reason field is filled
- Transaction should appear in history immediately

### Navigation not working
- Restart the app
- Check your internet connection (if using cloud features)
- Update to the latest version

## Keyboard Shortcuts (iOS/Android)

- **Back navigation**: Swipe from left edge (iOS) or use system back button (Android)
- **Dismiss keyboard**: Tap outside text field or press return key

## Accessibility

The Students module supports:
- Screen readers
- Large text sizes
- High contrast mode
- Voice input for text fields

## Data Safety

- All data is stored locally on your device
- Use regular backups if available
- Be careful when deleting students (permanent action)
- Balance transactions cannot be edited, only added (for audit trail)

## Need Help?

- Check the full implementation documentation: `STUDENTS_MODULE_IMPLEMENTATION.md`
- Look for error messages in the app
- Ensure all required fields are filled when creating/editing

## Future Features (Planned)

- Filter students by goals
- Sort students by name, balance, date added
- Export student list
- Add profile photos
- Advanced search with multiple criteria
- Bulk operations

---

**Version**: 1.0.0  
**Last Updated**: November 2025
**Platform**: React Native / Expo

