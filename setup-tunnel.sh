#!/bin/bash

# Budget Manager - Cloudflare Tunnel Setup Script
# Hướng dẫn setup Cloudflare Tunnel cho domain budget.roger.works

echo "======================================"
echo "Cloudflare Tunnel Setup"
echo "Domain: budget.roger.works"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${YELLOW}cloudflared chưa được cài đặt. Đang cài đặt...${NC}"
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        sudo dpkg -i cloudflared-linux-amd64.deb
        rm cloudflared-linux-amd64.deb
        echo -e "${GREEN}✓ Đã cài đặt cloudflared${NC}"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install cloudflared
        echo -e "${GREEN}✓ Đã cài đặt cloudflared${NC}"
    else
        echo -e "${RED}✗ OS không được hỗ trợ. Vui lòng cài đặt thủ công.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ cloudflared đã được cài đặt${NC}"
fi

echo ""
echo "======================================"
echo "Các bước tiếp theo:"
echo "======================================"
echo ""
echo "1. Login vào Cloudflare:"
echo -e "   ${YELLOW}cloudflared tunnel login${NC}"
echo "   (Browser sẽ mở, chọn domain 'roger.works')"
echo ""
echo "2. Tạo tunnel:"
echo -e "   ${YELLOW}cloudflared tunnel create budget-app${NC}"
echo "   (Lưu lại TUNNEL_UUID được tạo ra)"
echo ""
echo "3. Tạo file config:"
echo -e "   ${YELLOW}mkdir -p ~/.cloudflared${NC}"
echo -e "   ${YELLOW}nano ~/.cloudflared/config.yml${NC}"
echo ""
echo "   Nội dung file:"
echo "   ---"
echo "   url: http://localhost:80"
echo "   tunnel: <TUNNEL_UUID>"
echo "   credentials-file: /home/$USER/.cloudflared/<TUNNEL_UUID>.json"
echo "   ---"
echo ""
echo "4. Tạo DNS record:"
echo -e "   ${YELLOW}cloudflared tunnel route dns budget-app budget.roger.works${NC}"
echo ""
echo "5. Chạy tunnel (test):"
echo -e "   ${YELLOW}cloudflared tunnel run budget-app${NC}"
echo ""
echo "6. Cài đặt service (auto-start):"
echo -e "   ${YELLOW}sudo cloudflared service install${NC}"
echo -e "   ${YELLOW}sudo systemctl start cloudflared${NC}"
echo -e "   ${YELLOW}sudo systemctl enable cloudflared${NC}"
echo ""
echo "7. Kiểm tra:"
echo -e "   ${YELLOW}curl https://budget.roger.works/health${NC}"
echo ""
echo "======================================"
echo "Quick Commands:"
echo "======================================"
echo ""
echo "Check tunnel status:"
echo -e "   ${YELLOW}cloudflared tunnel info budget-app${NC}"
echo ""
echo "View logs:"
echo -e "   ${YELLOW}sudo journalctl -u cloudflared -f${NC}"
echo ""
echo "Restart tunnel:"
echo -e "   ${YELLOW}sudo systemctl restart cloudflared${NC}"
echo ""
echo "Stop tunnel:"
echo -e "   ${YELLOW}sudo systemctl stop cloudflared${NC}"
echo ""
echo "======================================"
echo "Docker Services:"
echo "======================================"
echo ""
echo "Start all services:"
echo -e "   ${YELLOW}docker-compose up -d${NC}"
echo ""
echo "Check status:"
echo -e "   ${YELLOW}docker-compose ps${NC}"
echo ""
echo "View nginx logs:"
echo -e "   ${YELLOW}docker-compose logs -f nginx${NC}"
echo ""
echo "Test local:"
echo -e "   ${YELLOW}curl http://localhost/health${NC}"
echo ""
