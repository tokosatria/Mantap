🧪 VS Code Testing Commands Reference
📋 Quick Commands List
🚀 Setup & Start
# Quick setup (recommended)
./test-setup.sh

# Manual setup local jika hapus Cache (next,node,lock)
npx next build --no-cache
npm install
npx prisma generate
npx tsc --noEmit --pretty false
npm run build
npm run dev

# jika File awal ambil dari Back up
npm install
npm install -D tailwindcss-animate
npm install -D tailwindcss postcss autoprefixer @tailwindcss/postcss
npm install dotenv
npm install @supabase/ssr
npm install @supabase/supabase-js
npm install @prisma/client
# jika ada perubahan prisma
npx prisma generate               :  WAJIB dijalankan setiap kali kamu mengubah file prisma/schema.prisma.
npx prisma db push                : HATI-HATI! Perintah ini menerapkan perubahan schema ke database. 
                                    JANGAN pernah jalankan ini jika kamu
# perintah Cek 
npx tsc --noEmit --pretty false   : Ini untuk mengecek error TypeScript. Bagus dijalankan sebelum build.
npm run lint
npm run build                     : Ini untuk membangun aplikasi versi production.
# perintah 1x di 1 komputer
npm install -g prisma
npm install -g vercel

# perintah debug
node check-env.js
node debug-local-data.js
note test-api.js
node test-setup.sh

# jalankan lokal
npm run dev

# Build for production
npm run build

Hak akses
git init
git rm -r --cached .
git add .
git commit -m " "
git push origin main
git push origin main --force 
git status
git checkout main
Hapus .next lalu bisa jalan jalan hehehehehehe



pindah kamar git checkout -b fitur-panduan-guru
git checkout main 
git merge fitur-panduan-guru
git push origin main
git branch -d fitur-panduan-guru