#!/bin/bash

echo "Applying SafeAreaView fixes to all remaining screens..."

# Student Details  
perl -i -pe 's/import { View, Text,/import { View, Text, SafeAreaView,/' app/student/\[id\].tsx
perl -i -pe 's/<View style={styles\.container}>/<SafeAreaView style={styles.container} edges={["top"]}>/' app/student/\[id\].tsx
perl -i -pe 's/<\/View>\s*\)\s*;\s*}\s*const styles/;<\/SafeAreaView>\n  );\n}\n\nconst styles/' app/student/\[id\].tsx

# Student New
perl -i -pe 's/import { View, Text,/import { View, Text, SafeAreaView,/' app/student/new.tsx  
perl -i -pe 's/<View style={styles\.container}>/<SafeAreaView style={styles.container} edges={["top"]}>/' app/student/new.tsx
perl -i -pe 's/<\/KeyboardAvoidingView>\s*<\/View>/<\/KeyboardAvoidingView>\n    <\/SafeAreaView>/' app/student/new.tsx

# Student Edit
perl -i -pe 's/import { View, Text,/import { View, Text, SafeAreaView,/' app/student/\[id\]/edit.tsx
perl -i -pe 's/<View style={styles\.container}>/<SafeAreaView style={styles.container} edges={["top"]}>/' app/student/\[id\]/edit.tsx  
perl -i -pe 's/<\/KeyboardAvoidingView>\s*<\/View>/<\/KeyboardAvoidingView>\n    <\/SafeAreaView>/' app/student/\[id\]/edit.tsx

# Calendar Day View
perl -i -pe 's/import { View, Text,/import { View, Text, SafeAreaView,/' app/calendar/day/\[date\].tsx
perl -i -pe 's/<View style={styles\.container}>/<SafeAreaView style={styles.container} edges={["top"]}>/' app/calendar/day/\[date\].tsx
perl -i -pe 's/<\/ScrollView>\s*<\/View>/<\/ScrollView>\n    <\/SafeAreaView>/' app/calendar/day/\[date\].tsx

echo "✅ All files updated!"
echo "Now run: npm start -- --clear"
