@echo off
:: -------------------------------------------------------------
::  POS System – PostgreSQL quick‑setup script
:: -------------------------------------------------------------
::  1. Ask the user for a password for the new DB user
::  2. Create the DB user and the database
::  3. Run the migration SQL files
::  4. Write a .env file that the Tauri app will read
:: -------------------------------------------------------------

:: Ensure UTF-8 encoding for psql to prevent garbled text (like â€”)
chcp 65001 >nul
set PGCLIENTENCODING=utf8

:: ---- 1. Prompt for password ------------------------------------------------
set "PG_PASSWORD="
set /p PG_PASSWORD="Enter a password for the PostgreSQL user 'shop_user': "

if "%PG_PASSWORD%"=="" (
    echo [ERROR] No password supplied – aborting.
    goto :eof
)

:: ---- 2. Create user and database -------------------------------------------
echo.
echo [INFO] Creating PostgreSQL user 'shop_user'...
psql -U postgres -h localhost -p 5432 -c "DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'shop_user') THEN CREATE ROLE shop_user WITH LOGIN PASSWORD '%PG_PASSWORD%'; END IF; END $$;"

if errorlevel 1 (
    echo [ERROR] Failed to create or verify user 'shop_user'.
    goto :eof
)

echo [INFO] Creating database 'shop_pos' (if it does not exist)...
rem --- Create database if it does not exist ---
createdb -U postgres -h localhost -p 5432 shop_pos 2>nul
if errorlevel 1 (
    echo [INFO] Database may already exist, proceeding...
) else (
    echo [INFO] Database created successfully.
)
rem continue without aborting

echo [INFO] Granting all privileges on shop_pos to shop_user...
rem --- Grant privileges to the new user ---
psql -U postgres -h localhost -p 5432 -d shop_pos -c "GRANT ALL PRIVILEGES ON DATABASE shop_pos TO shop_user;"
psql -U postgres -h localhost -p 5432 -d shop_pos -c "GRANT ALL ON SCHEMA public TO shop_user;"

if errorlevel 1 (
    echo [ERROR] Failed to grant privileges.
    goto :eof
)

:: ---- 3. Run migrations ----------------------------------------------------
echo.
echo [INFO] Running migration 001_init.sql ...
psql -U shop_user -h localhost -p 5432 -d shop_pos -f "src-tauri\src\db\migrations\001_init.sql"

if errorlevel 1 (
    echo [ERROR] Migration 001_init.sql failed.
    goto :eof
)

echo [INFO] Running migration 002_add_permissions.sql ...
psql -U shop_user -h localhost -p 5432 -d shop_pos -f "src-tauri\src\db\migrations\002_add_permissions.sql"

if errorlevel 1 (
    echo [ERROR] Migration 002_add_permissions.sql failed.
    goto :eof
)

:: ---- 4. Write .env file ----------------------------------------------------
set "ENV_FILE=.env"
echo.
echo [INFO] Writing connection string to %ENV_FILE% ...

(
    echo # PostgreSQL Database Connection String
    echo DATABASE_URL=postgres://shop_user:%PG_PASSWORD%@localhost:5432/shop_pos
) > "%ENV_FILE%"

if errorlevel 1 (
    echo [ERROR] Could not write %ENV_FILE%.
    goto :eof
)

echo.
echo ==============================================================
echo   PostgreSQL setup completed successfully!
echo   • User      : shop_user
echo   • Database  : shop_pos
echo   • Connection string written to %ENV_FILE%
echo   • You can now run:  npm run tauri dev   (or build)
echo ==============================================================
echo.
pause
