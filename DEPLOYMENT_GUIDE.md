


# Deployment Guide for **Shop POS System**

## Prerequisites
- Windows 10/11 (both server and client machines)
- **PostgreSQL** installed on the server PC (>= 15 recommended)
- **Node.js** (v20) and **Rust** toolchain installed (only needed for building, already done)
- Network connectivity between the two PCs (they must be able to reach each other on port **5432**)

## 1. Prepare the Server PC (Database Host)
1. Open an **Administrator PowerShell** and navigate to the project root:
   ```powershell
   cd "C:\\Users\\ACER\\Documents\\App Dev Projects\\Shop POS System"
   ```
2. Run the database setup script:
   ```powershell
   .\\setup_postgres.bat
   ```
   - You will be prompted for a password for the `shop_user` database user. Remember it – it will be used by the client app.
   - The script will:
     - Create the `shop_user` role (if it does not exist)
     - Create the `shop_pos` database (if it does not exist)
     - Grant **ALL** privileges on the database **and** the `public` schema to `shop_user`
     - Ensure UTF‑8 encoding so the splash‑screen logo appears correctly.
3. Verify the database connection:
   ```powershell
   psql -U shop_user -h localhost -p 5432 -d shop_pos -c "SELECT 1;"
   ```
   It should return `1` without errors.
4. (Optional) Open firewall port 5432 for inbound connections:
   ```powershell
   netsh advfirewall firewall add rule name="PostgreSQL" dir=in action=allow protocol=TCP localport=5432
   ```

## 2. Build the Installers (one‑time step – already completed)
If you need to rebuild:
```powershell
npm run tauri build
```
The command produces two installers in `src-tauri\\target\\release\\bundle`:
- **MSI**: `Shop POS System_0.1.1_x64_en-US.msi`
- **NSIS**: `Shop POS System_0.1.1_x64-setup.exe`

## 3. Deploy to Client PCs (Cashier terminals)
1. Copy the **installer** (`.msi` or `.exe`) to each client machine – via USB drive, network share, or any file‑transfer method.
2. Run the installer and follow the wizard (default settings are fine).
3. After installation, locate the generated **`.env`** file. It lives next to the executable (e.g., `C:\\Program Files\\Shop POS System\\.env`).
4. Edit the `.env` file to point to the **server’s IP address** and the password you set earlier:
   ```dotenv
   DATABASE_URL=postgres://shop_user:<PASSWORD>@<SERVER_IP>:5432/shop_pos
   ```
   Replace `<PASSWORD>` and `<SERVER_IP>` accordingly.
5. Save the file and **restart** the application.

## 4. First Run – Verify the Setup
1. Launch **Shop POS System**.
2. The splash screen will appear with your custom transparent logo while the app loads.
3. The main window will automatically **maximize** to fill the screen.
4. Log in with an admin account (created via the UI or the initial seed data).
5. Verify that:
   - The product list loads.
   - Sales and revenue tabs are accessible to cashiers.
   - All data persists across the two PCs (they share the same PostgreSQL instance).

## 5. Maintenance Tips
- **Database backups**: periodically run `pg_dump -U shop_user -h <SERVER_IP> -Fc shop_pos > backup.dump`.
- **Update the app**: run `npm run tauri build` on a development machine, copy the new installer to the clients, and reinstall.
- **Firewall changes**: if the network layout changes, ensure port **5432** remains open between the server and any new client machines.

---
**Happy selling!** Your POS system is now ready for production use.
