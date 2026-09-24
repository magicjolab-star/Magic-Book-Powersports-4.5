Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$AppId = "com.magicproduction.magicbook"
$VersionName = "5.1.0"
$VersionCode = 51000
$Alias = "magicbook"
$Keystore = Join-Path $Root "magic-book-upload.keystore"
$ReleaseDir = Join-Path $Root "release"
$FinalAab = Join-Path $ReleaseDir "Magic-Book-Powersports-5.1.0-production.aab"

function Assert-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Commande requise introuvable: $Name"
    }
}

function Secure-ToPlain {
    param([Security.SecureString]$Secure)
    $Ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Ptr)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Ptr)
    }
}

foreach ($Tool in @("node","npm","npx","java","keytool","jarsigner")) {
    Assert-Command $Tool
}

if (-not (Test-Path $Keystore)) {
    throw "Keystore introuvable: $Keystore"
}

$StorePassword = Secure-ToPlain (Read-Host "Mot de passe du keystore" -AsSecureString)
$KeyPassword = Secure-ToPlain (Read-Host "Mot de passe de la clé magicbook" -AsSecureString)

$env:MAGIC_STOREPASS = $StorePassword
$env:MAGIC_KEYPASS = $KeyPassword
$env:APP_ANDROID_PACKAGE = $AppId
$env:APP_ANDROID_VERSION_CODE = "$VersionCode"
$env:EAS_BUILD_PROFILE = "production"
$env:EAS_BUILD_PLATFORM = "android"

try {
    npm install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

    npm run typecheck
    if ($LASTEXITCODE -ne 0) { throw "typecheck failed" }

    npm test
    if ($LASTEXITCODE -ne 0) { throw "tests failed" }

    npm run build
    if ($LASTEXITCODE -ne 0) { throw "web build failed" }

    if (-not (Test-Path "android")) {
        npx cap add android
        if ($LASTEXITCODE -ne 0) { throw "cap add android failed" }
    }

    npx cap sync android
    if ($LASTEXITCODE -ne 0) { throw "cap sync android failed" }

    $VarsPath = "android\variables.gradle"
    $Vars = Get-Content $VarsPath -Raw
    $Vars = [regex]::Replace($Vars, "compileSdkVersion\s*=\s*\d+", "compileSdkVersion = 36")
    $Vars = [regex]::Replace($Vars, "targetSdkVersion\s*=\s*\d+", "targetSdkVersion = 36")
    [IO.File]::WriteAllText((Resolve-Path $VarsPath), $Vars, [Text.UTF8Encoding]::new($false))

    $GradlePath = "android\app\build.gradle"
    $Gradle = Get-Content $GradlePath -Raw
    $Gradle = [regex]::Replace($Gradle, 'applicationId\s+"[^"]+"', ('applicationId "' + $AppId + '"'))
    $Gradle = [regex]::Replace($Gradle, 'namespace\s*=\s*"[^"]+"', ('namespace = "' + $AppId + '"'))
    $Gradle = [regex]::Replace($Gradle, 'versionCode\s+\d+', ("versionCode " + $VersionCode))
    $Gradle = [regex]::Replace($Gradle, 'versionName\s+"[^"]+"', ('versionName "' + $VersionName + '"'))
    $Gradle = (($Gradle -split "\r?\n") | Where-Object {
        $_ -notmatch 'com\.android\.billingclient:billing'
    }) -join [Environment]::NewLine
    [IO.File]::WriteAllText((Resolve-Path $GradlePath), $Gradle, [Text.UTF8Encoding]::new($false))

    $OldReferences = Get-ChildItem -Path . -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object {
            $_.Name -ne "build-playstore.ps1" -and
            $_.FullName -notmatch '\\node_modules\\' -and
            $_.FullName -notmatch '\\.git\\' -and
            $_.FullName -notmatch '\\dist\\' -and
            $_.FullName -notmatch '\\build\\' -and
            $_.FullName -notmatch '\\release\\'
        } |
        Select-String -SimpleMatch "com.magicjolab.magicbook" -ErrorAction SilentlyContinue

    if ($OldReferences) {
        throw "Ancien Application ID détecté dans le projet."
    }

    keytool -list -keystore $Keystore -alias $Alias -storepass:env MAGIC_STOREPASS
    if ($LASTEXITCODE -ne 0) { throw "Validation keystore failed" }

    Push-Location android
    try {
        .\gradlew.bat clean bundleRelease --no-daemon --stacktrace
        if ($LASTEXITCODE -ne 0) { throw "bundleRelease failed" }
    }
    finally {
        Pop-Location
    }

    $SourceAab = "android\app\build\outputs\bundle\release\app-release.aab"
    if (-not (Test-Path $SourceAab)) {
        throw "AAB introuvable: $SourceAab"
    }

    New-Item -ItemType Directory -Path $ReleaseDir -Force | Out-Null
    Copy-Item $SourceAab $FinalAab -Force

    jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore $Keystore -storepass:env MAGIC_STOREPASS -keypass:env MAGIC_KEYPASS $FinalAab $Alias
    if ($LASTEXITCODE -ne 0) { throw "jarsigner failed" }

    jarsigner -verify -strict -certs $FinalAab
    if ($LASTEXITCODE -ne 0) { throw "signature verification failed" }

    $Hash = Get-FileHash $FinalAab -Algorithm SHA256

    Write-Host ""
    Write-Host "MAGIC BOOK POWERSPORTS V5.1 READY" -ForegroundColor Green
    Write-Host "Application ID: $AppId" -ForegroundColor Green
    Write-Host "AAB: $FinalAab" -ForegroundColor Green
    Write-Host ("SHA256: " + $Hash.Hash) -ForegroundColor Green
}
finally {
    $StorePassword = $null
    $KeyPassword = $null
    Remove-Item Env:MAGIC_STOREPASS -ErrorAction SilentlyContinue
    Remove-Item Env:MAGIC_KEYPASS -ErrorAction SilentlyContinue
    Remove-Item Env:APP_ANDROID_PACKAGE -ErrorAction SilentlyContinue
    Remove-Item Env:APP_ANDROID_VERSION_CODE -ErrorAction SilentlyContinue
    Remove-Item Env:EAS_BUILD_PROFILE -ErrorAction SilentlyContinue
    Remove-Item Env:EAS_BUILD_PLATFORM -ErrorAction SilentlyContinue
    [GC]::Collect()
}
