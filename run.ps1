Write-Host "Iniciando FoodFlow MVP..." -ForegroundColor Green

function Stop-PortProcess {
    param([int]$Port)

    $connections = netstat -ano | Select-String ":$Port\s" | ForEach-Object {
        ($_ -split "\s+")[-1]
    } | Where-Object {
        $_ -match "^\d+$" -and $_ -ne "0"
    } | Select-Object -Unique

    foreach ($oldProcessId in $connections) {
        try {
            Stop-Process -Id ([int]$oldProcessId) -Force -ErrorAction Stop
            Write-Host "Processo antigo na porta $Port encerrado: $oldProcessId" -ForegroundColor Yellow
        } catch {
            Write-Host "Nao foi possivel encerrar o processo $oldProcessId na porta $Port." -ForegroundColor DarkYellow
        }
    }
}

Write-Host "Limpando servidores antigos..." -ForegroundColor Cyan
Stop-PortProcess -Port 8000
Stop-PortProcess -Port 8001
Stop-PortProcess -Port 5173
Stop-PortProcess -Port 5174

Write-Host "Iniciando Back-end (FastAPI)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8001"

Write-Host "Iniciando Front-end (Vite/React)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Servidores sendo iniciados em novas abas/janelas! Pode fechar esta se desejar." -ForegroundColor Green
