# CPU Optimization Guide

## Problem
Expo was consuming excessive CPU resources on a 1 vCPU server, causing performance issues.

## Solutions Applied

### 1. Docker Resource Limits
Added CPU and memory limits in [docker-compose.yml](docker-compose.yml):
- CPU limit: 0.8 cores (80% max)
- CPU reservation: 0.3 cores (30% minimum)
- Memory limit: 512MB
- Memory reservation: 256MB

### 2. Metro Bundler Optimization
Created [metro.config.js](mobile/metro.config.js) with:
- `maxWorkers: 1` - Single worker thread
- Disabled Watchman (file watching)
- Filesystem caching enabled
- Console logging removed in production

### 3. Production Mode
Modified [start-expo.sh](mobile/start-expo.sh) to run with:
- `--no-dev` - Disables development features
- `--minify` - Enables code minification
- `NODE_ENV=production` - Production optimizations
- `UV_THREADPOOL_SIZE=2` - Reduced thread pool
- `--max-old-space-size=384` - Limit Node.js memory

### 4. Babel Configuration
Created [babel.config.js](mobile/babel.config.js) with:
- Lazy imports for smaller bundles
- Console removal in production
- Optimized transformations

### 5. Environment Variables
Added CPU-friendly settings:
- `METRO_MAX_WORKERS=1`
- `CI=1` (disables interactive features)
- `EXPO_NO_TELEMETRY=1`
- `EXPO_NO_DOTENV=1`
- `GENERATE_SOURCEMAP=false`

## Usage

### Quick Management
Use the mobile management script:

```bash
# Stop mobile to save CPU (when not actively developing)
./manage-mobile.sh stop

# Start mobile when needed
./manage-mobile.sh start

# Check CPU usage
./manage-mobile.sh status

# Restart mobile
./manage-mobile.sh restart
```

### Rebuild with Optimizations
```bash
# Rebuild mobile service with new optimizations
docker-compose build mobile --no-cache

# Start with resource limits
docker-compose up -d mobile

# Monitor CPU usage
docker stats budget-manager-mobile
```

### Monitor Performance
```bash
# Watch CPU usage in real-time
docker stats budget-manager-mobile

# Check logs for performance issues
docker-compose logs -f mobile

# View resource usage
docker-compose ps
docker inspect budget-manager-mobile | grep -A 10 Resources
```

## Expected CPU Usage

### Before Optimization
- Idle: 40-60% CPU
- Building: 90-100% CPU
- Total system impact: Severe

### After Optimization
- Idle: 10-20% CPU
- Building: 50-70% CPU (slower but sustainable)
- Total system impact: Moderate

## Best Practices for 1 vCPU

### 1. Keep Mobile Stopped When Not Needed
```bash
# Stop when not developing mobile app
./manage-mobile.sh stop

# This frees up ~15-20% CPU for backend/frontend
```

### 2. Build Once, Use Many Times
- Avoid frequent rebuilds
- Use tunnel mode to connect from devices
- Code changes require rebuild (no hot reload with current setup)

### 3. Stagger Service Startups
```bash
# Start services in order
docker-compose up -d postgres
sleep 5
docker-compose up -d backend
sleep 5
docker-compose up -d frontend nginx
# Start mobile only when needed
docker-compose up -d mobile
```

### 4. Monitor System Resources
```bash
# Check overall system CPU
top

# Check Docker CPU usage
docker stats

# Check disk I/O (can impact CPU)
iostat 1
```

### 5. Consider Alternatives for Mobile Development

If CPU is still too high, consider:

**Option A: Local Development**
```bash
# Run Expo locally on your development machine
cd mobile
npm install
npm start
```

**Option B: Selective Development**
- Develop mobile features locally
- Only deploy to server for testing
- Keep server mobile service stopped

**Option C: Increase Resources**
- Upgrade to 2 vCPU if budget allows
- Use cloud development environment

## Troubleshooting

### High CPU After Optimization

1. **Check if multiple workers are running:**
```bash
docker exec -it budget-manager-mobile ps aux | grep node
```

2. **Verify environment variables:**
```bash
docker exec -it budget-manager-mobile env | grep -E "METRO|NODE_ENV|CI"
```

3. **Check for file watching:**
```bash
docker exec -it budget-manager-mobile lsof | wc -l
# Should be low (<100 files)
```

### Slow Build Times

This is expected with `maxWorkers: 1`. Trade-offs:
- ✅ Lower CPU usage
- ❌ Slower build times (2-3x longer)

### App Not Hot Reloading

This is expected with `--no-dev` mode. To enable hot reload:
- Accept higher CPU usage
- Remove `--no-dev` from start-expo.sh
- Or develop locally

## Additional Optimizations

### Disable Mobile Service Entirely
If not using mobile app, disable in docker-compose.yml:

```yaml
# Comment out or remove mobile service
# mobile:
#   build:
#   ...
```

### Use Docker Compose Profiles
Add profile to mobile service:

```yaml
mobile:
  profiles: ["mobile"]  # Only start with --profile mobile
```

Then start selectively:
```bash
# Start without mobile
docker-compose up -d

# Start with mobile
docker-compose --profile mobile up -d
```

## Performance Metrics

Track these metrics:
- CPU usage: `docker stats`
- Memory usage: `docker stats`
- Build time: Time from start to bundle ready
- Response time: Backend API latency

Target metrics for 1 vCPU:
- Mobile CPU: <30% when idle
- Total system CPU: <80% with all services
- Memory: <512MB for mobile

## References
- [Metro Bundler Configuration](https://facebook.github.io/metro/docs/configuration)
- [Expo Optimization](https://docs.expo.dev/guides/customizing-metro/)
- [Docker Resource Limits](https://docs.docker.com/compose/compose-file/deploy/)
- [Node.js Performance](https://nodejs.org/en/docs/guides/simple-profiling)
