# Migration to Web + Mobile Repository

## 📋 Status

This repository was created on **November 4, 2024** as a copy of the original Yoga tracker project.

**Purpose**: This is the new repository for developing both **web** and **mobile** versions of the Yoga Class Tracker.

## 🎯 Current State

- ✅ **Copied from**: Original `Yoga` repository
- ✅ **Git initialized**: Ready for remote repository connection
- ✅ **All source files**: Copied successfully (excluding `node_modules`, `.next`, build artifacts)
- ✅ **Original repo**: Untouched and preserved separately

## 📁 Repository Structure

Currently, the repository contains the original Next.js web application. The next steps will be to:

1. **Restructure** into dual codebase:
   - `web/` - Next.js web application (current codebase)
   - `mobile/` - React Native mobile application (to be created)
   - `shared/` - Shared code (types, utilities, business logic)

2. **Set up** monorepo structure (optional)

## 🚀 Next Steps

1. **Connect to remote Git repository**:
   ```bash
   cd /Users/ivanbasyj/Yoga-web-mob
   git remote add origin <your-repo-url>
   git add .
   git commit -m "Initial commit: Copied from original Yoga repository"
   git push -u origin main
   ```

2. **Restructure for dual codebase** (web + mobile)

3. **Set up React Native** in `mobile/` directory

4. **Extract shared code** to `shared/` directory

## 📝 Notes

- Original repository remains untouched at `/Users/ivanbasyj/Yoga`
- This repository is ready for web + mobile development
- All source code, components, and utilities have been preserved

