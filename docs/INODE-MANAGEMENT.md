# Inode Usage Management

## Problem
This project was using **93,021 files and 11,899 directories**, consuming excessive inodes. This is primarily caused by:
- Multiple `node_modules` directories (backend, frontend, mobile)
- Build artifacts and cache files
- Log files
- Expo cache directories

## Solution Applied

### 1. Docker Compose Changes
- **Removed volume mounts** from the mobile service that were syncing the entire directory including `node_modules`
- This prevents Docker from creating bind mounts with thousands of files

### 2. Enhanced .dockerignore Files
Updated `.dockerignore` in all service directories (backend, frontend, mobile) and root to exclude:
- `node_modules/`
- Build outputs (`build/`, `dist/`, `.expo/`)
- Logs and cache files
- IDE and OS files
- Test files

### 3. Updated .gitignore
Added exclusions for:
- `mobile/node_modules/`
- `mobile/.expo/` and `.expo-shared/`
- Enhanced log file exclusions

### 4. Cleanup Script
Created `cleanup-inodes.sh` to easily clean up:
- All `node_modules` directories
- Build artifacts
- Log files
- Cache directories
- Docker build cache (optional)

## Current Status
After cleanup:
- **Files: 1,016** (down from 93,021) - **99% reduction**
- **Directories: 297** (down from 11,899) - **97% reduction**

## Usage

### Running the Cleanup Script
```bash
./cleanup-inodes.sh
```

### Rebuilding After Cleanup

For local development:
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ../mobile && npm install
```

For Docker:
```bash
# Rebuild containers (they will install dependencies internally)
docker-compose build --no-cache
docker-compose up -d
```

## Best Practices

### For Development
1. **Don't commit `node_modules`** - They're excluded in `.gitignore`
2. **Clean build artifacts regularly** - Run `cleanup-inodes.sh` periodically
3. **Use Docker for production** - Containers isolate dependencies

### For Docker
1. **Never mount `node_modules` as volumes** - Let Docker handle them internally
2. **Use multi-stage builds** - Frontend already uses this (build stage + nginx)
3. **Optimize .dockerignore** - Keep it updated to exclude unnecessary files

### For CI/CD
1. **Cache `node_modules` properly** - Use CI/CD caching mechanisms
2. **Clean workspace after builds** - Remove build artifacts between runs
3. **Use `npm ci` instead of `npm install`** - Faster and more reliable

## Mobile Development Notes

The mobile service no longer uses volume mounts. This means:

**For development:**
- Edit code locally
- Rebuild the container: `docker-compose build mobile`
- Restart: `docker-compose up -d mobile`

**Alternative for rapid development:**
- Run Expo locally (outside Docker): `cd mobile && npm start`
- Connect from your mobile device

## Monitoring Inode Usage

Check current usage:
```bash
find . -type f | wc -l    # Count files
find . -type d | wc -l    # Count directories
du -sh node_modules       # Check size of node_modules
```

Check system inode limits:
```bash
df -i                      # System-wide inode usage
```

## Maintenance

Run cleanup monthly or when you notice:
- Slow file operations
- Disk space warnings
- Git operations slowing down
- Docker build performance degradation

## References
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Understanding Inodes](https://www.howtogeek.com/465350/everything-you-ever-wanted-to-know-about-inodes-on-linux/)
