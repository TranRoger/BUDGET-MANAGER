#!/bin/bash

# Script to manage mobile service for CPU conservation

show_usage() {
    echo "Usage: ./manage-mobile.sh [start|stop|restart|status|disable|enable]"
    echo ""
    echo "Commands:"
    echo "  start   - Start the mobile service"
    echo "  stop    - Stop the mobile service to save CPU"
    echo "  restart - Restart the mobile service"
    echo "  status  - Check if mobile service is running"
    echo "  disable - Stop and prevent mobile from auto-starting"
    echo "  enable  - Re-enable mobile service auto-start"
    echo ""
    echo "💡 Tip: Keep mobile stopped when not actively developing the app to save CPU"
}

case "$1" in
    start)
        echo "🚀 Starting mobile service..."
        docker-compose up -d mobile
        echo "✅ Mobile service started"
        echo "📱 Check logs: docker-compose logs -f mobile"
        ;;
    
    stop)
        echo "⏸️  Stopping mobile service to conserve CPU..."
        docker-compose stop mobile
        echo "✅ Mobile service stopped"
        echo "💾 CPU resources freed up"
        ;;
    
    restart)
        echo "🔄 Restarting mobile service..."
        docker-compose restart mobile
        echo "✅ Mobile service restarted"
        ;;
    
    status)
        echo "📊 Mobile service status:"
        docker-compose ps mobile
        echo ""
        if docker-compose ps mobile | grep -q "Up"; then
            echo "🟢 Mobile is running"
            echo "📈 CPU usage:"
            docker stats budget-manager-mobile --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
        else
            echo "🔴 Mobile is stopped"
        fi
        ;;
    
    disable)
        echo "🛑 Disabling mobile service..."
        docker-compose stop mobile
        docker-compose rm -f mobile
        echo "✅ Mobile service disabled"
        echo "💡 To re-enable: ./manage-mobile.sh enable"
        ;;
    
    enable)
        echo "✅ Enabling mobile service..."
        docker-compose up -d mobile
        echo "✅ Mobile service enabled and started"
        ;;
    
    *)
        show_usage
        exit 1
        ;;
esac
