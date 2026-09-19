Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$AppId = "com.magicproduction.magicbook"
$VersionName = "6.0.0"
$VersionCode = 60000
$Alias = "magicbook"

$WebSource = Join-Path $Root "v6-golden-master"
$Dist = Join-Path $Root "dist"
$AndroidDir = Join-Path $Root "android"
$Keystore = Join-Path $Root "magic-book-upload.keystore"
$ReleaseDir = Join-Path $Root "release"
$FinalAab = Join-Path $ReleaseDir "Magic-Book-Powersports-6.0.0-production.aab"

function Assert-Command {
    param([Parameter(Mandatory)][string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Commande requise introuvable : $Name"
    }
}

function Secure-ToPlain {
    param([Parameter(Mandatory)][Security.SecureString]$Secure)

    $Ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)

    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Ptr)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Ptr)
    }
}

function Write-Utf8NoBom {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Content
    )

    [IO.File]::WriteAllText(
        $Path,
        $Content,
        [Text.UTF8Encoding]::new($false)
    )
}

function Ensure-Directory {
    param([Parameter(Mandatory)][string]$Path)

    New-Item -ItemType Directory -Path $Path -Force | Out-Null
}

foreach ($Tool in @(
    "node",
    "npm",
    "npx",
    "java",
    "keytool",
    "jarsigner"
)) {
    Assert-Command $Tool
}

if (-not (Test-Path $WebSource)) {
    throw "Golden Master V6 introuvable : $WebSource"
}

if (-not (Test-Path (Join-Path $WebSource "index-360.html"))) {
    throw "index-360.html Golden Master introuvable."
}

if (-not (Test-Path $Keystore)) {
    throw "Keystore introuvable : $Keystore"
}

if (-not (Test-Path (Join-Path $Root "upload-playstore.js"))) {
    throw "upload-playstore.js introuvable."
}

$StorePassword = Secure-ToPlain (
    Read-Host "Mot de passe du keystore" -AsSecureString
)

$KeyPassword = Secure-ToPlain (
    Read-Host "Mot de passe de la clé magicbook" -AsSecureString
)

$env:MAGIC_STOREPASS = $StorePassword
$env:MAGIC_KEYPASS = $KeyPassword
$env:APP_ANDROID_PACKAGE = $AppId
$env:APP_ANDROID_VERSION_CODE = "$VersionCode"
$env:EAS_BUILD_PROFILE = "production"
$env:EAS_BUILD_PLATFORM = "android"

try {
    Write-Host "Installation des dépendances V6..." -ForegroundColor Cyan

    npm install --no-audit --no-fund

    if ($LASTEXITCODE -ne 0) {
        throw "npm install a échoué."
    }

    node --check upload-playstore.js

    if ($LASTEXITCODE -ne 0) {
        throw "upload-playstore.js contient une erreur de syntaxe."
    }

    node --check v6-golden-master/premium-360.js

    if ($LASTEXITCODE -ne 0) {
        throw "premium-360.js contient une erreur de syntaxe."
    }

    Write-Host "Construction du Web Golden Master V6..." -ForegroundColor Cyan

    if (Test-Path $Dist) {
        Remove-Item $Dist -Recurse -Force
    }

    Ensure-Directory $Dist

    Copy-Item (Join-Path $WebSource "*") $Dist -Recurse -Force

    $DistApi = Join-Path $Dist "api"

    if (Test-Path $DistApi) {
        Remove-Item $DistApi -Recurse -Force
    }

    $Readme = Join-Path $Dist "README-V6-GOLDEN-MASTER.md"

    if (Test-Path $Readme) {
        Remove-Item $Readme -Force
    }

    $GoldenIndex = Join-Path $Dist "index-360.html"
    $Index = Get-Content $GoldenIndex -Raw

    $Index = $Index.Replace("?v=460", "?v=600")
    $Index = $Index.Replace("Version V4.6", "Version V6.0")
    $Index = $Index.Replace("Magic Book Powersports V4.6", "Magic Book Powersports V6.0")

    Write-Utf8NoBom -Path $GoldenIndex -Content $Index
    Write-Utf8NoBom -Path (Join-Path $Dist "index.html") -Content $Index

    $AssetLinks = Join-Path $Root ".well-known\assetlinks.json"

    if (Test-Path $AssetLinks) {
        $WellKnown = Join-Path $Dist ".well-known"
        Ensure-Directory $WellKnown

        Copy-Item $AssetLinks (Join-Path $WellKnown "assetlinks.json") -Force
    }

    $SplashVideo = Join-Path $Root "splash-video.mp4"

    if (Test-Path $SplashVideo) {
        foreach ($FallbackVideo in @(
            (Join-Path $Dist "v44-intro.mp4"),
            (Join-Path $Dist "18559_2.mp4")
        )) {
            if (-not (Test-Path $FallbackVideo)) {
                Copy-Item $SplashVideo $FallbackVideo -Force
            }
        }

        $AssetsDir = Join-Path $Dist "assets"
        Ensure-Directory $AssetsDir

        $LoaderVideo = Join-Path $AssetsDir "17525.mp4"

        if (-not (Test-Path $LoaderVideo)) {
            Copy-Item $SplashVideo $LoaderVideo -Force
        }
    }

    $CapConfig = Join-Path $Root "capacitor.config.ts"
    $CapText = Get-Content $CapConfig -Raw

    $CapText = [regex]::Replace(
        $CapText,
        "const appId\s*=\s*[^;]+;",
        "const appId = process.env.APP_ANDROID_PACKAGE || '$AppId';"
    )

    Write-Utf8NoBom -Path $CapConfig -Content $CapText

    if (-not (Test-Path $AndroidDir)) {
        Write-Host "Création du projet Android Capacitor..." -ForegroundColor Cyan

        npx cap add android

        if ($LASTEXITCODE -ne 0) {
            throw "npx cap add android a échoué."
        }
    }

    Write-Host "Synchronisation Capacitor Android..." -ForegroundColor Cyan

    npx cap sync android

    if ($LASTEXITCODE -ne 0) {
        throw "npx cap sync android a échoué."
    }

    $VariablesGradle = Join-Path $AndroidDir "variables.gradle"

    if (-not (Test-Path $VariablesGradle)) {
        throw "android/variables.gradle introuvable."
    }

    $Variables = Get-Content $VariablesGradle -Raw
    $Variables = [regex]::Replace(
        $Variables,
        "compileSdkVersion\s*=\s*\d+",
        "compileSdkVersion = 36"
    )
    $Variables = [regex]::Replace(
        $Variables,
        "targetSdkVersion\s*=\s*\d+",
        "targetSdkVersion = 36"
    )

    Write-Utf8NoBom -Path $VariablesGradle -Content $Variables

    $AppGradle = Join-Path $AndroidDir "app\build.gradle"

    if (-not (Test-Path $AppGradle)) {
        throw "android/app/build.gradle introuvable."
    }

    $Gradle = Get-Content $AppGradle -Raw

    $Gradle = [regex]::Replace(
        $Gradle,
        'applicationId\s+"[^"]+"',
        ('applicationId "' + $AppId + '"')
    )

    $Gradle = [regex]::Replace(
        $Gradle,
        'namespace\s*=\s*"[^"]+"',
        ('namespace = "' + $AppId + '"')
    )

    $Gradle = [regex]::Replace(
        $Gradle,
        'namespace\s+"[^"]+"',
        ('namespace "' + $AppId + '"')
    )

    $Gradle = [regex]::Replace(
        $Gradle,
        'versionCode\s+\d+',
        ("versionCode " + $VersionCode)
    )

    $Gradle = [regex]::Replace(
        $Gradle,
        'versionName\s+"[^"]+"',
        ('versionName "' + $VersionName + '"')
    )

    $Gradle = (($Gradle -split "\r?\n") | Where-Object {
        $_ -notmatch 'com\.android\.billingclient:billing'
    }) -join [Environment]::NewLine

    Write-Utf8NoBom -Path $AppGradle -Content $Gradle

    $MainActivity = Get-ChildItem (
        Join-Path $AndroidDir "app\src\main"
    ) -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object {
        $_.Name -match '^MainActivity\.(java|kt)$'
    } |
    Select-Object -First 1

    if ($MainActivity) {
        $MainText = Get-Content $MainActivity.FullName -Raw

        $MainText = [regex]::Replace(
            $MainText,
            'package\s+[A-Za-z0-9_.]+',
            "package $AppId"
        )

        $SourceRoot = if ($MainActivity.FullName -match '\\kotlin\\') {
            Join-Path $AndroidDir "app\src\main\kotlin"
        }
        else {
            Join-Path $AndroidDir "app\src\main\java"
        }

        $PackagePath = $AppId.Replace('.', '\')
        $TargetDir = Join-Path $SourceRoot $PackagePath
        Ensure-Directory $TargetDir

        $TargetActivity = Join-Path $TargetDir $MainActivity.Name

        Write-Utf8NoBom -Path $TargetActivity -Content $MainText

        if ($MainActivity.FullName -ne $TargetActivity) {
            Remove-Item $MainActivity.FullName -Force
        }
    }

    $GradleCheck = Get-Content $AppGradle -Raw

    if ($GradleCheck -notmatch [regex]::Escape($AppId)) {
        throw "Application ID final incorrect."
    }

    if ($GradleCheck -match 'com\.magicjolab\.magicbook') {
        throw "Ancien package Android encore présent."
    }

    Write-Host "Validation du keystore..." -ForegroundColor Cyan

    keytool -list -keystore $Keystore -alias $Alias -storepass:env MAGIC_STOREPASS

    if ($LASTEXITCODE -ne 0) {
        throw "Keystore ou alias magicbook invalide."
    }

    Write-Host "Compilation AAB Android API 36..." -ForegroundColor Cyan

    Push-Location $AndroidDir

    try {
        .\gradlew.bat clean bundleRelease --no-daemon --stacktrace

        if ($LASTEXITCODE -ne 0) {
            throw "Gradle bundleRelease a échoué."
        }
    }
    finally {
        Pop-Location
    }

    $BundleDir = Join-Path $AndroidDir "app\build\outputs\bundle\release"

    $BuiltAab = Get-ChildItem $BundleDir -Filter "*.aab" -File |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if (-not $BuiltAab) {
        throw "Aucun AAB généré."
    }

    Ensure-Directory $ReleaseDir

    if (Test-Path $FinalAab) {
        Remove-Item $FinalAab -Force
    }

    Copy-Item $BuiltAab.FullName $FinalAab -Force

    Write-Host "Signature AAB..." -ForegroundColor Cyan

    jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore $Keystore -storepass:env MAGIC_STOREPASS -keypass:env MAGIC_KEYPASS $FinalAab $Alias

    if ($LASTEXITCODE -ne 0) {
        throw "Signature jarsigner a échoué."
    }

    jarsigner -verify -strict -certs $FinalAab

    if ($LASTEXITCODE -ne 0) {
        throw "Signature finale AAB invalide."
    }

    $Hash = Get-FileHash $FinalAab -Algorithm SHA256

    Write-Host ""
    Write-Host "MAGIC BOOK POWERSPORTS V6.0 GOLDEN MASTER BUILD OK" -ForegroundColor Green
    Write-Host "Application ID : $AppId" -ForegroundColor Green
    Write-Host "Version        : $VersionName" -ForegroundColor Green
    Write-Host "Version Code   : $VersionCode" -ForegroundColor Green
    Write-Host "Android API    : 36" -ForegroundColor Green
    Write-Host "AAB            : $FinalAab" -ForegroundColor Green
    Write-Host ("SHA256         : " + $Hash.Hash) -ForegroundColor Green

    Write-Host ""
    Write-Host "Publication automatique Google Play Internal..." -ForegroundColor Cyan

    node upload-playstore.js

    if ($LASTEXITCODE -ne 0) {
        throw "Upload Google Play Internal a échoué."
    }

    Write-Host ""
    Write-Host "✅ V6.0 SIGNÉE ET PUBLIÉE SUR GOOGLE PLAY INTERNAL" -ForegroundColor Green
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
