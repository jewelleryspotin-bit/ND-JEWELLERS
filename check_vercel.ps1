try {
    $r = Invoke-WebRequest -Uri 'https://shree-jewellers.vercel.app'
    Write-Host "Success! Found shree-jewellers.vercel.app"
    if ($r.Content -match "VASNANI") { Write-Host "It shows VASNANI" }
    elseif ($r.Content -match "HARDIK") { Write-Host "It shows HARDIK" }
} catch {
    Write-Host "shree-jewellers.vercel.app failed"
}
