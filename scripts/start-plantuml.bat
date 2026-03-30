@echo off
REM PlantUML 服务器启动脚本 (Windows)

echo 🚀 启动 PlantUML Docker 服务...

REM 检查 Docker 是否运行
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker 未运行，请先启动 Docker Desktop
    pause
    exit /b 1
)

REM 停止已存在的容器
docker stop plantuml-server 2>nul
docker rm plantuml-server 2>nul

REM 启动 PlantUML 服务器 (端口 33629)
docker run -d --name plantuml-server -p 33629:8080 -e JETTY_PORT=8080 plantuml/plantuml-server:jetty

echo ✅ PlantUML 服务已启动!
echo 📍 服务地址: http://localhost:33629
echo 📍 SVG 渲染: http://localhost:33629/svg/~1{encoded}
echo 📍 PNG 渲染: http://localhost:33629/png/~1{encoded}
echo.
echo 停止服务: docker stop plantuml-server

pause
