# simiaoChat Static File Server
# Uses .NET HttpListener - no Python/Node required
param(
    [int]$Port = 8080
)

$root = if ($MyInvocation.MyCommand.Path) { Split-Path -Parent $MyInvocation.MyCommand.Path } else { $PWD.Path }

# MIME type mapping
$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.htm'  = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
    '.webp' = 'image/webp'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
    '.ttf'  = 'font/ttf'
    '.eot'  = 'application/vnd.ms-fontobject'
    '.otf'  = 'font/otf'
    '.map'  = 'application/json'
    '.xml'  = 'application/xml'
    '.txt'  = 'text/plain; charset=utf-8'
}

# Try to bind, auto-increment if port is in use
$maxAttempts = 10
$bound = $false

for ($attempt = 0; $attempt -lt $maxAttempts; $attempt++) {
    $listener = New-Object System.Net.HttpListener
    try {
        $listener.Prefixes.Add("http://localhost:${Port}/")
        $listener.Start()
        $bound = $true
        break
    } catch {
        $listener.Close()
        Write-Host "Port $Port is in use, trying $($Port + 1)..." -ForegroundColor Yellow
        $Port++
    }
}

if (-not $bound) {
    Write-Host "Failed to bind after $maxAttempts attempts. Please free a port." -ForegroundColor Red
    exit 1
}

try {
    Write-Host "Server running at http://localhost:${Port}/" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow
    Write-Host ""

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # Parse URL path, default to index.html
        $urlPath = $request.Url.AbsolutePath
        if ($urlPath -eq '/') { $urlPath = '/index.html' }

        # Decode and build local file path
        $decodedPath = [System.Uri]::UnescapeDataString($urlPath)
        $filePath = Join-Path $root $decodedPath.TrimStart('/')

        # Security: prevent path traversal
        $fullRoot = (Resolve-Path $root).Path
        try {
            $fullFilePath = (Resolve-Path $filePath -ErrorAction Stop).Path
            if (-not $fullFilePath.StartsWith($fullRoot)) {
                $response.StatusCode = 403
                $response.Close()
                continue
            }
        } catch {
            $response.StatusCode = 404
            $response.Close()
            Write-Host "  404 $urlPath" -ForegroundColor Red
            continue
        }

        if (Test-Path $fullFilePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($fullFilePath).ToLower()
            $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' }
            $response.ContentType = $contentType

            # Cache control: no cache for html/js/css during dev
            if ($ext -in '.html','.js','.css','.json') {
                $response.Headers.Add('Cache-Control', 'no-cache, no-store')
            }

            $buffer = [System.IO.File]::ReadAllBytes($fullFilePath)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            Write-Host "  $($response.StatusCode) $urlPath" -ForegroundColor Cyan
        } else {
            $response.StatusCode = 404
            $response.Close()
            Write-Host "  404 $urlPath" -ForegroundColor Red
        }
    }
} catch {
    # Suppress Ctrl+C error output
} finally {
    $listener.Stop()
    Write-Host "Server stopped."
}
