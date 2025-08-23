@echo off
echo Starting MongoDB...

REM Try different possible MongoDB installation paths
if exist "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" (
    echo Found MongoDB 8.0
    "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --dbpath "D:\Projects\Comptivia\Comptivia_invoice\invoice-reconciliation\mongodb"
) else if exist "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" (
    echo Found MongoDB 7.0
    "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "D:\Projects\Comptivia\Comptivia_invoice\invoice-reconciliation\mongodb"
) else if exist "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" (
    echo Found MongoDB 6.0
    "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath "D:\Projects\Comptivia\Comptivia_invoice\invoice-reconciliation\mongodb"
) else (
    echo MongoDB not found in standard locations
    echo Please check your MongoDB installation
    pause
)
