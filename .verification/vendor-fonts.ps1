$ErrorActionPreference = 'Stop'
$fontDirectory = Join-Path $PSScriptRoot '../public/fonts'
New-Item -ItemType Directory -Force -Path $fontDirectory | Out-Null
$fontAssets = @(
  @{ File='dm-sans-latin-variable.woff2'; Url='https://fonts.gstatic.com/s/dmsans/v17/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K4.woff2'; Family='DM Sans'; License='dmsans' },
  @{ File='manrope-latin-variable.woff2'; Url='https://fonts.gstatic.com/s/manrope/v23/xn7gYHE41ni1AdIRggexSg.woff2'; Family='Manrope'; License='manrope' },
  @{ File='instrument-serif-latin-italic.woff2'; Url='https://fonts.gstatic.com/s/instrumentserif/v5/jizHRFtNs2ka5fXjeivQ4LroWlx-6zAjjH7M.woff2'; Family='Instrument Serif'; License='instrumentserif' },
  @{ File='noto-sans-arabic-arabic.woff2'; Url='https://fonts.gstatic.com/s/notosansarabic/v33/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5l3sQWIHPqzCfyGyfuXqAJQI.woff2'; Family='Noto Sans Arabic'; License='notosansarabic' },
  @{ File='noto-sans-malayalam-malayalam.woff2'; Url='https://fonts.gstatic.com/s/notosansmalayalam/v29/sJoi3K5XjsSdcnzn071rL37lpAOsUThnDZIfPdbeSNzVakglNM-Qw8EaeB8Nss-_RuDNG1bFn6E.woff2'; Family='Noto Sans Malayalam'; License='notosansmalayalam' }
)
$fontNotices = [System.Collections.Generic.List[string]]::new()
$fontNotices.Add("Self-hosted typography for Dario Martin Monteiro's portfolio`nRetrieved from Google Fonts on 2026-11-05. Original unmodified WOFF2 subsets.`nFonts remain subject to their respective SIL Open Font Licenses below.`n")
foreach ($fontAsset in $fontAssets) {
  $fontDestination = Join-Path $fontDirectory $fontAsset.File
  Invoke-WebRequest -UseBasicParsing -Uri $fontAsset.Url -OutFile $fontDestination
  $fontBytes = [System.IO.File]::ReadAllBytes($fontDestination)
  if ([System.Text.Encoding]::ASCII.GetString($fontBytes,0,4) -ne 'wOF2') { throw "Invalid WOFF2: $($fontAsset.File)" }
  $fontLicenseUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/' + $fontAsset.License + '/OFL.txt'
  $fontLicense = (Invoke-WebRequest -UseBasicParsing -Uri $fontLicenseUrl).Content
  if ($fontLicense -notmatch 'SIL OPEN FONT LICENSE') { throw "Missing OFL license: $($fontAsset.Family)" }
  $fontNotices.Add("`n============================================================`n$($fontAsset.Family)`nFile: fonts/$($fontAsset.File)`nSource: $($fontAsset.Url)`nLicense source: $fontLicenseUrl`n`n$fontLicense")
  Write-Output "$($fontAsset.File): $($fontBytes.Length) bytes; WOFF2 signature valid"
}
[System.IO.File]::WriteAllText((Join-Path $fontDirectory '../FONT-NOTICES.txt'), ($fontNotices -join "`n"), [System.Text.UTF8Encoding]::new($false))
