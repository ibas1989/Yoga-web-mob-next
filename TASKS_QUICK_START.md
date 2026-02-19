# Tasks Feature - Quick Start Guide

## 🎯 What's Been Implemented

The Tasks tab now shows all overdue scheduled sessions that need to be completed, with full functionality matching the web app.

## 🚀 How to Test

### 1. Start the Mobile App

```bash
cd /Users/ivanbasyj/Yoga-web-mob/mobile
npm start
# or
expo start
```

### 2. Navigate to Tasks Tab

- Open the app
- Tap on the "Tasks" tab (📋 icon) in the bottom navigation
- Should show "Задачи" (Russian) or "Tasks" (English) depending on language

### 3. Test Scenarios

#### Scenario A: No Overdue Sessions
**Expected Result**: 
- See empty state with checkmark icon
- Message: "No pending tasks" / "Нет ожидающих задач"
- Subtext: "All your sessions are up to date!"

#### Scenario B: With Overdue Sessions
**Setup**: Create a session in the past
1. Go to Calendar tab
2. Create a session with:
   - Date: Yesterday or earlier
   - End time: In the past
   - Status: Scheduled
   - Assign some students

**Expected Result**:
- See task card showing:
  - Clock icon (⏰)
  - "Session with X student(s)"
  - Date and time
  - "Pending" badge (orange)

#### Scenario C: View Task Details
**Steps**:
1. Tap on any task card
2. Modal should open showing:
   - Task title
   - Date and time
   - Student names
   - "What to do" section
   - "Complete task" button
   - "Cancel" button

#### Scenario D: Complete a Task
**Steps**:
1. Tap on a task card
2. Tap "Complete Task" button
3. Should navigate to Session Details page
4. Tap "Complete" button
5. Fill in completion details
6. Confirm completion
7. Should return to Tasks tab
8. Task should disappear from list

#### Scenario E: Pull to Refresh
**Steps**:
1. On Tasks screen, pull down to refresh
2. Should show refresh indicator
3. List should reload

#### Scenario F: Language Switching
**Steps**:
1. Go to Settings tab
2. Change language (EN ↔ RU)
3. Go back to Tasks tab
4. All text should be in selected language
5. Date/time formatting should respect locale

## 📱 Features Checklist

### Display Features
- ✅ Fixed header with title and description
- ✅ Loading state with spinner
- ✅ Empty state when no tasks
- ✅ Task cards with:
  - Clock icon
  - Session name
  - Date (localized format)
  - Time (localized format)
  - Pending badge

### Interactive Features
- ✅ Tap task to view details
- ✅ Task detail modal with full info
- ✅ Complete task navigation
- ✅ Pull-to-refresh
- ✅ Auto-refresh on screen focus
- ✅ Back navigation support

### Internationalization
- ✅ English translations
- ✅ Russian translations
- ✅ Proper plural forms
- ✅ Localized date formats
- ✅ Localized time formats

### Navigation Flow
- ✅ Tasks → Task Details (Modal)
- ✅ Tasks → Session Details (with returnTo)
- ✅ Session Details → Complete Session (with returnTo)
- ✅ Complete Session → Tasks (returns back)

## 🎨 Visual Elements

### Colors
- Primary action: Orange (#f97316)
- Background: Light gray (#f9fafb)
- Cards: White (#ffffff)
- Text: Dark gray (#111827)
- Secondary text: Medium gray (#6b7280)
- Badge: Orange tint (#fff7ed with #c2410c text)

### Icons
- Clock emoji (⏰) for task cards
- Checkmark (✓) for empty state
- Calendar (📅) for dates
- Users (👥) for students

## 🔧 Technical Details

### Files Modified
1. `/mobile/app/(tabs)/tasks.tsx` - Main implementation
2. `/mobile/app/(tabs)/_layout.tsx` - Added translations
3. `/shared/lib/utils/dateUtils.ts` - Added utility function

### Dependencies Used
- React Native core components
- Expo Router for navigation
- react-i18next for translations
- AsyncStorage for data
- Shared types and utilities

### State Management
- Local state with useState
- Automatic refresh with useFocusEffect
- Pull-to-refresh with RefreshControl
- Modal state for task details

## 🐛 Troubleshooting

### Tasks Not Showing?
**Check**:
1. Do you have scheduled sessions in the past?
2. Are the sessions still marked as "scheduled" (not completed/cancelled)?
3. Has the session's end time passed?

### Fix: Create a Test Session
```javascript
// In mobile app, create a session with:
date: new Date('2025-11-04'), // Yesterday
startTime: '10:00',
endTime: '11:00',
status: 'scheduled',
studentIds: ['some-student-id']
```

### Modal Not Opening?
- Make sure you're tapping the card (not just the badge)
- Check console for errors

### Navigation Not Working?
- Ensure returnTo parameter is properly formatted
- Check that session ID is valid
- Verify session exists in storage

## 📊 Data Flow

```
Storage (AsyncStorage)
    ↓
getSessions() + getStudents()
    ↓
Filter: status='scheduled' && isSessionEndTimePassed()
    ↓
Map to Task objects
    ↓
Sort by date (oldest first)
    ↓
Display in UI
    ↓
User taps task → Modal
    ↓
User taps "Complete" → Session Details
    ↓
Complete session → Updates storage
    ↓
Return to Tasks → Auto-refresh → Updated list
```

## 🎓 How It Works

### Task Determination
A session becomes a task when:
1. Status is "scheduled" (not completed or cancelled)
2. Current time > session end time
3. Session has not been marked complete

### Auto-Refresh
Tasks list automatically refreshes when:
1. Screen first loads
2. Screen comes into focus (tab switch)
3. User pulls to refresh
4. After completing a session

### Translation Keys Used
```
tasks.title
tasks.description
tasks.loading
tasks.loadingDescription
tasks.noPendingTasks
tasks.allSessionsUpToDate
tasks.sessionWithStudents
tasks.conductSession
tasks.taskDetails
tasks.whatToDo
tasks.completeTask
tasks.pending
tasks.date
tasks.time
common.at
common.cancel
```

## ✅ Verification Steps

1. **Install & Run**
```bash
cd mobile
npm install  # if needed
npm start
```

2. **Check Translations**
- Switch language in settings
- Verify all text changes
- Check date/time formats

3. **Test Full Flow**
- Create overdue session
- View in tasks
- Open details
- Complete session
- Verify task disappears

4. **Test Edge Cases**
- No tasks (empty state)
- Many tasks (scrolling)
- Long student names
- Multiple students
- Different date formats

## 🎉 Success Criteria

The implementation is successful if:
- ✅ Tasks list loads and displays correctly
- ✅ Task cards show all required information
- ✅ Modal opens with complete details
- ✅ Navigation to session details works
- ✅ Completing task updates list
- ✅ All text is translated
- ✅ No errors in console
- ✅ Smooth user experience

## 📝 Notes

- The Tasks feature is now at feature parity with the web app
- All translations are already in place (no updates needed)
- Navigation flow respects returnTo parameter consistently
- Uses shared utilities for consistency between web and mobile
- Follows existing mobile app patterns and styling

## 🚀 Next Steps

The Tasks feature is **complete and ready to use**. No additional setup required.

Optional enhancements for the future:
- Add task count badge on tab icon
- Add push notifications for overdue tasks
- Add swipe actions on task cards
- Add filtering/sorting options




