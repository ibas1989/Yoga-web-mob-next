# Students Module - Navigation Flow

## Visual Navigation Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE APP                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    BOTTOM TAB BAR                        │  │
│  │                                                          │  │
│  │  [Calendar]  [Students]  [Tasks]  [Settings]            │  │
│  │                  ^^^^                                    │  │
│  │                  Selected                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           STUDENTS LIST SCREEN                           │  │
│  │           (app/(tabs)/students.tsx)                      │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  Title: Students                                   │ │  │
│  │  │  [Search Bar: "Search students..."]                │ │  │
│  │  │  [+ Create New Button]                             │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  [👤] John Doe                      Balance: +5    │ │  │
│  │  │       +1 234 567 890                               │ │  │
│  │  ├────────────────────────────────────────────────────┤ │  │
│  │  │  [👤] Jane Smith                    Balance: -3    │ │  │
│  │  │       +1 234 567 891                               │ │  │
│  │  ├────────────────────────────────────────────────────┤ │  │
│  │  │  [👤] Bob Johnson                   Balance: 0     │ │  │
│  │  │       +1 234 567 892                               │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│                    │                    │                       │
│                    │                    │                       │
│          (tap card)│                    │(tap Create)           │
│                    ▼                    ▼                       │
│  ┌────────────────────────┐  ┌────────────────────────┐        │
│  │  STUDENT DETAILS       │  │  CREATE NEW STUDENT    │        │
│  │  (app/student/[id])    │  │  (app/student/new)     │        │
│  │                        │  │                        │        │
│  │  [←] John Doe [✏️][🗑️]│  │  [←] New Student [Save]│        │
│  │                        │  │                        │        │
│  │  Personal Info:        │  │  Name: [_________]     │        │
│  │  • Name: John Doe      │  │  Phone: [_________]    │        │
│  │  • Phone: +1234...     │  │  Weight: [_____] kg    │        │
│  │  • Weight: 75 kg       │  │  Height: [_____] cm    │        │
│  │  • Height: 180 cm      │  │  Birthday: [YYYY-MM-DD]│        │
│  │  • Age: 25 years       │  │  Member Since: [YYYY...]│       │
│  │  • Balance: +5 [+]     │  │  Balance: [0]          │        │
│  │                        │  │  Description: [____]   │        │
│  │  Description:          │  │                        │        │
│  │  [Text content...]     │  │  Goals:                │        │
│  │                        │  │  [ ] Flexibility       │        │
│  │  Goals:                │  │  [✓] Strength          │        │
│  │  [Flexibility] [...]   │  │  [ ] Balance           │        │
│  │                        │  │  ...                   │        │
│  │  Notes: [+]            │  │                        │        │
│  │  [Note 1]              │  │  [Create Button]       │        │
│  │  [Note 2]              │  │                        │        │
│  │                        │  └────────────────────────┘        │
│  │  Balance History:      │              │                     │
│  │  [Transaction 1]       │              │(tap Create)         │
│  │  [Transaction 2]       │              ▼                     │
│  │                        │        Student created!            │
│  │  Session History:      │        Return to list              │
│  │  [Session 1]           │                                    │
│  │  [Session 2]           │                                    │
│  │                        │                                    │
│  └────────────────────────┘                                    │
│            │                                                    │
│            │(tap Edit ✏️)                                       │
│            ▼                                                    │
│  ┌────────────────────────┐                                    │
│  │  EDIT STUDENT          │                                    │
│  │  (app/student/[id]/    │                                    │
│  │   edit)                │                                    │
│  │                        │                                    │
│  │  [←] Edit Student [Save]│                                   │
│  │                        │                                    │
│  │  Name: [John Doe___]   │                                    │
│  │  Phone: [+1234...___]  │                                    │
│  │  Weight: [75____] kg   │                                    │
│  │  Height: [180___] cm   │                                    │
│  │  Birthday: [YYYY-MM-DD]│                                    │
│  │  Member Since: [YYYY...]│                                   │
│  │                        │                                    │
│  │  Balance: +5           │                                    │
│  │  (System managed)      │                                    │
│  │                        │                                    │
│  │  Description: [____]   │                                    │
│  │                        │                                    │
│  │  Goals:                │                                    │
│  │  [✓] Flexibility       │                                    │
│  │  [✓] Strength          │                                    │
│  │  [ ] Balance           │                                    │
│  │  ...                   │                                    │
│  │                        │                                    │
│  │  [Save Button]         │                                    │
│  │                        │                                    │
│  └────────────────────────┘                                    │
│            │                                                    │
│            │(tap Save)                                          │
│            ▼                                                    │
│      Student updated!                                          │
│      Return to details                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Modal Dialogs (Overlays)

### 1. Add Balance Transaction Modal
Triggered from Student Details → Balance [+] button

```
┌────────────────────────────────────────┐
│  Add Balance Transaction               │
│                                        │
│  Amount: [_________]                   │
│  (+ to add, - to deduct)               │
│                                        │
│  Reason: [_________]                   │
│  (e.g., "Purchased 10 sessions")       │
│                                        │
│  [Cancel]              [Add Transaction]│
└────────────────────────────────────────┘
```

### 2. Add Note Modal
Triggered from Student Details → Notes [+] button

```
┌────────────────────────────────────────┐
│  Add Note                              │
│                                        │
│  Content:                              │
│  ┌────────────────────────────────────┐│
│  │                                    ││
│  │ Type note content here...          ││
│  │                                    ││
│  │                                    ││
│  └────────────────────────────────────┘│
│                                        │
│  [Cancel]                      [Save]  │
└────────────────────────────────────────┘
```

### 3. Delete Confirmation Dialog
Triggered from Student Details → Delete [🗑️] button

```
┌────────────────────────────────────────┐
│  Delete Student                        │
│                                        │
│  Are you sure you want to delete this  │
│  student? This action cannot be undone.│
│                                        │
│  [Cancel]                    [Delete]  │
└────────────────────────────────────────┘
```

## Action Flows

### Creating a Student
```
Start at Students List
  ↓
Tap "Create New"
  ↓
Fill in form (app/student/new)
  ↓
Tap "Create"
  ↓
Validation
  ↓ (success)
Save to AsyncStorage
  ↓
Show success alert
  ↓
Navigate back to Students List
  ↓
New student appears in list
```

### Editing a Student
```
Start at Students List
  ↓
Tap student card
  ↓
View Details (app/student/[id])
  ↓
Tap Edit button [✏️]
  ↓
Edit form (app/student/[id]/edit)
  ↓
Modify fields
  ↓
Tap "Save"
  ↓
Validation
  ↓ (success)
Update in AsyncStorage
  ↓
Show success alert
  ↓
Navigate back to Details
  ↓
Updated info displayed
```

### Adding Balance Transaction
```
Start at Student Details
  ↓
Tap Balance [+] button
  ↓
Modal opens
  ↓
Enter amount and reason
  ↓
Tap "Add Transaction"
  ↓
Validation
  ↓ (success)
Calculate new balance
  ↓
Save transaction
  ↓
Update student balance
  ↓
Save to AsyncStorage
  ↓
Close modal
  ↓
Show success alert
  ↓
Refresh student details
  ↓
New transaction appears in history
New balance displayed
```

### Adding a Note
```
Start at Student Details
  ↓
Tap Notes [+] button
  ↓
Modal opens
  ↓
Enter note content
  ↓
Tap "Save"
  ↓
Validation
  ↓ (success)
Create note with timestamp
  ↓
Save to AsyncStorage
  ↓
Close modal
  ↓
Show success alert
  ↓
Refresh student details
  ↓
New note appears in list
```

### Deleting a Student
```
Start at Student Details
  ↓
Tap Delete button [🗑️]
  ↓
Confirmation dialog
  ↓
Tap "Delete"
  ↓
Remove from AsyncStorage
  ↓
Navigate back to Students List
  ↓
Student removed from list
```

### Searching Students
```
Start at Students List
  ↓
Focus on search bar
  ↓
Type 2+ characters
  ↓
Filter students by name
  ↓
Display filtered results
  ↓
Tap [X] to clear
  ↓
Show all students again
```

## URL/Route Structure

```
/                              # Root (redirects to tabs)
├── (tabs)/                    # Tab navigation
│   ├── index                  # Calendar tab
│   ├── students               # Students list ← MAIN ENTRY
│   ├── tasks                  # Tasks tab
│   └── settings               # Settings tab
│
└── student/                   # Students module routes
    ├── new                    # Create student
    ├── [id]                   # Student details (dynamic)
    └── [id]/
        └── edit               # Edit student (nested dynamic)
```

## State Management Flow

```
AsyncStorage (Persistent)
         ↕
   Storage Functions
   (getStudents, saveStudent, etc.)
         ↕
   React State (useState)
         ↕
   UI Components
         ↕
   User Interactions
```

## Data Flow Example: Creating a Student

```
User Input Form
      ↓
   Validation
      ↓ (valid)
Create Student Object
{
  id: timestamp,
  name: "John Doe",
  phone: "+1234567890",
  balance: 0,
  goals: ["Flexibility"],
  ...
}
      ↓
saveStudent(newStudent)
      ↓
AsyncStorage.setItem('yoga_tracker_students', JSON.stringify([...]))
      ↓
Success callback
      ↓
router.back()
      ↓
Students List reloads
      ↓
New student visible
```

## Key Navigation Actions

| From | Action | To |
|------|--------|-----|
| Students List | Tap card | Student Details |
| Students List | Tap "Create New" | Create Student |
| Student Details | Tap Edit [✏️] | Edit Student |
| Student Details | Tap Delete [🗑️] | Delete confirmation → List |
| Student Details | Tap [←] Back | Students List |
| Create Student | Tap Save | List (with new student) |
| Create Student | Tap [←] Back | Students List |
| Edit Student | Tap Save | Student Details (updated) |
| Edit Student | Tap [←] Back | Student Details |

## Screen Headers

### Students List
```
┌─────────────────────────────────┐
│ Students                        │
└─────────────────────────────────┘
```

### Student Details
```
┌─────────────────────────────────┐
│ [←] John Doe         [✏️] [🗑️] │
└─────────────────────────────────┘
```

### Create Student
```
┌─────────────────────────────────┐
│ [←] New Student         [Create]│
└─────────────────────────────────┘
```

### Edit Student
```
┌─────────────────────────────────┐
│ [←] Edit Student          [Save]│
└─────────────────────────────────┘
```

## Color Coding

### Balance Badges
- **Red** (#dc2626): Positive balance (student owes sessions)
- **Green** (#16a34a): Zero/negative balance (good standing)

### Status Badges (Sessions)
- **Green** (#dcfce7 bg, #16a34a text): Completed
- **Red** (#fee2e2 bg, #dc2626 text): Cancelled
- **Blue** (#dbeafe bg, #2563eb text): Scheduled

### Goals Chips
- **Unselected**: Gray background (#f3f4f6)
- **Selected**: Indigo background (#eef2ff)

---

This navigation structure ensures intuitive user flows and maintains consistency with mobile UI/UX best practices.

