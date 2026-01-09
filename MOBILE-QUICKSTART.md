# 🚀 Quick Start: CPU-Optimized Mobile Service

## TL;DR - Rebuild Now
```bash
./rebuild-mobile.sh
```

## CPU Optimizations Applied

### ✅ What Changed
- **Production mode**: Faster runtime, lower CPU
- **Single worker**: `METRO_MAX_WORKERS=1` (reduces parallelism)
- **No dev tools**: Disabled Expo DevTools (saves ~10-15% CPU)
- **Resource limits**: Max 80% CPU, 512MB RAM
- **Disabled file watching**: No hot reload (reduces CPU spikes)
- **Minified bundles**: Smaller, faster code
- **Console removal**: Production builds remove console.log

### 📊 Expected Results
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Idle CPU | 40-60% | 10-20% | **66%** reduction |
| Peak CPU | 90-100% | 50-70% | **30%** reduction |
| Build Time | Fast | Slower | Trade-off for CPU |

## 🎯 Recommended Workflow

### For Active Mobile Development
```bash
# Start mobile
./manage-mobile.sh start

# Check tunnel URL
docker-compose logs mobile | grep 'exp://'

# Monitor CPU
./manage-mobile.sh status
```

### When Not Developing Mobile
```bash
# Stop mobile to save CPU
./manage-mobile.sh stop

# This frees up 15-20% CPU for backend/frontend
```

### Rebuild After Code Changes
```bash
# Quick rebuild
./rebuild-mobile.sh

# Or manual
docker-compose build mobile --no-cache
docker-compose up -d mobile
```

## 📱 Connecting Your Device

1. **Start mobile service**:
   ```bash
   ./manage-mobile.sh start
   ```

2. **Get tunnel URL**:
   ```bash
   docker-compose logs mobile | grep 'exp://'
   # Look for: exp://xx-xxx-xxx-xxx.ngrok-free.app
   ```

3. **Open Expo Go app** on your phone

4. **Enter URL manually** and paste the `exp://` URL

## 🔧 Troubleshooting

### CPU Still High?
```bash
# 1. Check what's running
docker stats

# 2. Verify environment
docker exec -it budget-manager-mobile env | grep METRO

# 3. Stop mobile when not needed
./manage-mobile.sh stop
```

### Build Too Slow?
```bash
# This is expected with 1 worker
# Options:
# A. Accept slower builds for lower CPU
# B. Develop mobile locally (outside Docker)
# C. Upgrade to 2 vCPU
```

### Can't Connect to App?
```bash
# 1. Check if mobile is running
docker-compose ps mobile

# 2. Check logs
docker-compose logs -f mobile

# 3. Verify ports
netstat -tlnp | grep -E "8081|19000"
```

## ⚙️ Configuration Files

All optimizations are in:
- [docker-compose.yml](docker-compose.yml) - Resource limits & env vars
- [mobile/metro.config.js](mobile/metro.config.js) - Metro bundler settings
- [mobile/babel.config.js](mobile/babel.config.js) - Babel optimizations
- [mobile/start-expo.sh](mobile/start-expo.sh) - Startup script
- [mobile/Dockerfile](mobile/Dockerfile) - Container config

## 🎛️ Management Commands

| Command | Purpose |
|---------|---------|
| `./manage-mobile.sh start` | Start mobile service |
| `./manage-mobile.sh stop` | Stop mobile (save CPU) |
| `./manage-mobile.sh status` | Check CPU usage |
| `./manage-mobile.sh restart` | Restart mobile |
| `./rebuild-mobile.sh` | Full rebuild with optimizations |
| `docker stats budget-manager-mobile` | Live CPU monitoring |

## 💡 Pro Tips

1. **Keep mobile stopped by default** - Only start when actively developing
2. **Use tunnel mode** - No need to be on same network
3. **Monitor CPU regularly** - `./manage-mobile.sh status`
4. **Plan your builds** - They're slower but sustainable
5. **Consider local dev** - Run `npm start` in mobile/ on your laptop for faster iteration

## 🆘 Need Help?

**Mobile service consuming too much CPU?**
→ Stop it: `./manage-mobile.sh stop`

**Can't connect to tunnel?**
→ Check firewall and ngrok limits

**Build taking forever?**
→ This is normal with 1 worker on 1 vCPU

**Want faster development?**
→ Run Expo locally on development machine

## 📚 Full Documentation

- [CPU-OPTIMIZATION.md](CPU-OPTIMIZATION.md) - Complete optimization guide
- [INODE-MANAGEMENT.md](INODE-MANAGEMENT.md) - Disk usage optimization

---

**Remember**: With 1 vCPU, you need to manage resources carefully. Stop services when not actively using them!
