@echo off
echo ==============================================
echo Menyalakan Server SIGAP (Laravel + React Vite)
echo ==============================================
echo.

:: Menjalankan Backend
echo Membuka terminal backend (PHP Artisan Serve)...
start cmd /k "title SIGAP Backend (Artisan) && php artisan serve"

:: Menjalankan Frontend
echo Membuka terminal frontend (NPM Run Dev)...
start cmd /k "title SIGAP Frontend (Vite) && npm run dev"

:: Menunggu sejenak agar server siap
timeout /t 3 /nobreak > nul

:: Membuka Browser Otomatis
echo Membuka browser ke http://127.0.0.1:8000...
start http://127.0.0.1:8000

echo Selesai! Anda bisa menutup jendela ini. Jangan tutup 2 jendela terminal hitam berwarna-warni yang baru saja terbuka.
timeout /t 5 > nul
exit
