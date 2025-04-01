#!/usr/bin/env bash
#
# create_cf_pages.sh
# Generates 9 Cloudflare custom pages for rentforevent.com
# using Google Tag Manager (GTM-TXT6DRX) and a custom event dataLayer push
# for each CF scenario (IP block, WAF, etc.). Logo at logo-rent.svg.
#

# Make a folder for all pages
mkdir -p cloudflare-custom-pages
cd cloudflare-custom-pages || exit 1

#########################################################
# Insert the GTM HEAD and BODY noscript for GTM-TXT6DRX
#########################################################
read -r -d '' GTM_HEAD << 'GTM_HEAD'
<!-- GOOGLE TAG MANAGER (HEAD) -->
<script>
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TXT6DRX');
</script>
<!-- END GTM (HEAD) -->
GTM_HEAD

read -r -d '' GTM_BODY << 'GTM_BODY'
<!-- GOOGLE TAG MANAGER (BODY) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TXT6DRX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- END GTM (BODY) -->
GTM_BODY

#########################################################
# 1) IP/Country Block
#########################################################
cat > ip-country-block.html << EOF
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8" />
  <title>Access Denied | rentforevent.com</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=Edge" />

  ${GTM_HEAD}

  <style>
    body {
      margin: 0; font-family: Arial, sans-serif; color: #333; text-align:center;
      padding: 40px 20px;
    }
    .logo img { max-width: 250px; height: auto; margin-bottom:20px; }
    h1 { font-weight:300; font-size:2.5rem; margin-bottom:0.3em; }
    h2 { font-weight:300; font-size:1.6rem; color:#555; margin-bottom:1em; }
    p { line-height:1.5em; margin:0.8em 0; }
    .footer { margin-top:2em; font-size:0.85rem; color:#999; }
    .footer a { color:#999; text-decoration:none; }
  </style>
</head>
<body>
  ${GTM_BODY}

  <!-- dataLayer push for IP/Country Block (RFE) -->
  <script>
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': 'IP_Country_Block_RFE',
    'rayId': '::RAY_ID::'
  });
  </script>

  <div class="logo">
    <img src="https://storage.googleapis.com/cloudflarerrror-rent/logo-rent.svg" alt="RentForEvent Logo">
  </div>
  <h1>Access Denied</h1>
  <h2>IP / Country Block</h2>
  <p>
    We’re sorry, but the owner of this website has banned your IP address 
    (<strong>::CLIENT_IP::</strong>).
  </p>
  <p>
    If you believe this block is in error, please contact <strong>rentforevent.com</strong>.
  </p>

  <div class="footer">
    Cloudflare Ray ID: <strong>::RAY_ID::</strong> &bull; 
    Your IP: <strong>::CLIENT_IP::</strong> &bull; 
    Powered by <a href="https://www.cloudflare.com/" target="_blank" rel="noopener noreferrer">
      Cloudflare
    </a>
  </div>
</body>
</html>
EOF

#########################################################
# 2) WAF Block
#########################################################
cat > waf-block.html << EOF
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8" />
  <title>WAF Block | rentforevent.com</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=Edge" />

  ${GTM_HEAD}

  <style>
    body { margin:0; font-family:Arial,sans-serif; text-align:center; padding:40px 20px; color:#333; }
    .logo img { max-width:250px; margin-bottom:20px; }
    h1 { font-weight:300; font-size:2.5rem; margin-bottom:0.3em; }
    h2 { font-weight:300; font-size:1.6rem; color:#555; margin-bottom:1em; }
    p { line-height:1.5em; margin:0.8em 0; }
    .footer { margin-top:2em; font-size:0.85rem; color:#999; }
    .footer a { color:#999; text-decoration:none; }
  </style>
</head>
<body>
  ${GTM_BODY}

  <!-- dataLayer push for WAF Block (RFE) -->
  <script>
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': 'WAF_Block_RFE',
    'rayId': '::RAY_ID::'
  });
  </script>

  <div class="logo">
    <img src="https://storage.googleapis.com/cloudflarerrror-rent/logo-rent.svg" alt="RentForEvent Logo">
  </div>
  <h1>WAF Block</h1>
  <h2>Request Blocked by Web Application Firewall</h2>
  <p>
    It appears you triggered a security rule. If you believe this block is an error,
    please contact <strong>rentforevent.com</strong>.
  </p>

  <div class="footer">
    Cloudflare Ray ID: <strong>::RAY_ID::</strong> &bull; 
    Your IP: <strong>::CLIENT_IP::</strong> &bull; 
    Powered by <a href="https://www.cloudflare.com/" target="_blank">
      Cloudflare
    </a>
  </div>
</body>
</html>
EOF

#########################################################
# 3) 500 Class errors
#########################################################
cat > 500-errors.html << EOF
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8" />
  <title>500 Class Error | rentforevent.com</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=Edge" />

  ${GTM_HEAD}

  <style>
    body { margin:0; font-family:Arial,sans-serif; color:#333; text-align:center; padding:40px 20px; }
    .logo img { max-width:250px; margin-bottom:20px; }
    h1 { font-weight:300; font-size:2.5rem; margin-bottom:0.3em; }
    h2 { font-weight:300; font-size:1.6rem; color:#555; margin-bottom:1em; }
    p { line-height:1.5em; margin:0.8em 0; }
    .footer { margin-top:2em; font-size:0.85rem; color:#999; text-align:center; }
    .footer a { color:#999; text-decoration:none; }
    .cf-token { margin:1em 0; font-style:italic; color:#666; }
  </style>
</head>
<body>
  ${GTM_BODY}

  <!-- Cloudflare 5xx token -->
  <div class="cf-token">
    ::CLOUDFLARE_ERROR_500S_BOX::
  </div>

  <!-- dataLayer push -->
  <script>
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': 'Error_5xx_RFE',
    'rayId': '::RAY_ID::'
  });
  </script>

  <div class="logo">
    <img src="https://storage.googleapis.com/cloudflarerrror-rent/logo-rent.svg" alt="RentForEvent Logo">
  </div>
  <h1>500 Class Error</h1>
  <h2>Something went wrong on our server</h2>
  <p>
    We’re sorry, but the request could not be processed. This often indicates a temporary
    overload or maintenance. Please try again soon.
  </p>

  <div class="footer">
    Cloudflare Ray ID: <strong>::RAY_ID::</strong> &bull;
    Your IP: <strong>::CLIENT_IP::</strong> &bull;
    Powered by <a href="https://www.cloudflare.com" target="_blank">Cloudflare</a>
  </div>
</body>
</html>
EOF

#########################################################
# 4) 1000 Class errors
#########################################################
cat > 1000-errors.html << EOF
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8" />
  <title>1000 Class Error | rentforevent.com</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />

  ${GTM_HEAD}

  <style>
    body { margin:0; font-family:Arial,sans-serif; color:#333; text-align:center; padding:40px 20px; }
    .logo img { max-width:250px; margin-bottom:20px; }
    h1 { font-weight:300; font-size:2.5rem; margin-bottom:0.3em; }
    h2 { font-weight:300; font-size:1.6rem; color:#555; margin-bottom:1em; }
    p { line-height:1.5em; margin:0.8em 0; }
    .footer { margin-top:2em; font-size:0.85rem; color:#999; }
    .footer a { color:#999; text-decoration:none; }
    .cf-token { margin:1em 0; font-style:italic; color:#666; }
  </style>
</head>
<body>
  ${GTM_BODY}

  <div class="cf-token">
    ::CLOUDFLARE_ERROR_1000S_BOX::
  </div>

  <script>
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': 'Error_1xxx_RFE',
    'rayId': '::RAY_ID::'
  });
  </script>

  <div class="logo">
    <img src="https://storage.googleapis.com/cloudflarerrror-rent/logo-rent.svg" alt="RentForEvent Logo">
  </div>
  <h1>1000 Class Error</h1>
  <h2>DNS or Routing Issue</h2>
  <p>
    Cloudflare can’t resolve the domain or the request is misconfigured.
    This typically indicates a DNS problem or newly added domain not fully set up.
  </p>
  <p>
    If you’re the owner, please verify your DNS records. Otherwise, check again later.
  </p>

  <div class="footer">
    Cloudflare Ray ID: <strong>::RAY_ID::</strong> &bull;
    Your IP: <strong>::CLIENT_IP::</strong> &bull;
    Powered by <a href="https://www.cloudflare.com/" target="_blank">Cloudflare</a>
  </div>
</body>
</html>
EOF

#########################################################
# 5) Interactive challenge
#########################################################
cat > interactive-challenge.html << EOF
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8" />
  <title>Interactive Challenge | rentforevent.com</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />

  ${GTM_HEAD}

  <style>
    body { margin:0; font-family:Arial,sans-serif; color:#333; text-align:center; padding:60px 20px; }
    .logo img { max-width:250px; margin-bottom:30px; }
    h1 { font-weight:300; font-size:2.5rem; margin-bottom:0.5em; }
    h2 { font-weight:300; font-size:1.6rem; color:#555; margin-bottom:1em; }
    p { line-height:1.5em; margin:0.8em 0; }
    .challenge-box { margin:2em 0; }
    .footer { margin-top:2em; font-size:0.85rem; color:#999; }
    .footer a { color:#999; text-decoration:none; }
  </style>
</head>
<body>
  ${GTM_BODY}

  <script>
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': 'Interactive_Challenge_RFE',
    'rayId': '::RAY_ID::'
  });
  </script>

  <div class="logo">
    <img src="https://storage.googleapis.com/cloudflarerrror-rent/logo-rent.svg" alt="RentForEvent Logo">
  </div>
  <h1>Interactive Challenge</h1>
  <h2>Please verify you’re human</h2>
  <p>Complete the challenge below to proceed.</p>

  <div class="challenge-box">
    ::CAPTCHA_BOX::
  </div>

  <p>If you think you’re seeing this by mistake, please contact rentforevent.com.</p>

  <div class="footer">
    Cloudflare Ray ID: <strong>::RAY_ID::</strong> &bull;
    Your IP: <strong>::CLIENT_IP::</strong> &bull;
    Powered by <a href="https://www.cloudflare.com/" target="_blank" rel="noopener noreferrer">Cloudflare</a>
  </div>
</body>
</html>
EOF

#########################################################
# 6) Managed Challenge / I'm Under Attack
#########################################################
cat > managed-challenge.html << EOF
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8" />
  <title>Under Attack Mode | rentforevent.com</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />

  ${GTM_HEAD}

  <style>
    body { margin:0; font-family:Arial,sans-serif; color:#333; text-align:center; padding:60px 20px; }
    .logo img { max-width:250px; margin-bottom:30px; }
    h1 { font-weight:300; font-size:2.5rem; margin-bottom:0.5em; }
    h2 { font-weight:300; font-size:1.6rem; color:#555; margin-bottom:1em; }
    p { line-height:1.5em; margin:0.8em 0; }
    .challenge-box { margin:2em 0; }
    .footer { margin-top:2em; font-size:0.85rem; color:#999; }
    .footer a { color:#999; text-decoration:none; }
  </style>
</head>
<body>
  ${GTM_BODY}

  <script>
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': 'Managed_Challenge_RFE',
    'rayId': '::RAY_ID::'
  });
  </script>

  <div class="logo">
    <img src="https://storage.googleapis.com/cloudflarerrror-rent/logo-rent.svg" alt="RentForEvent Logo">
  </div>

  <h1>Under Attack Mode</h1>
  <h2>We’re verifying your browser...</h2>
  <p>This helps protect rentforevent.com from malicious requests. Please wait or complete any required challenge below.</p>

  <div class="challenge-box">
    ::CAPTCHA_BOX::
  </div>

  <p>If you think you’ve reached this in error, contact the site owner.</p>

  <div class="footer">
    Cloudflare Ray ID: <strong>::RAY_ID::</strong> &bull;
    Your IP: <strong>::CLIENT_IP::</strong> &bull;
    Powered by <a href="https://www.cloudflare.com/" target="_blank" rel="noopener noreferrer">Cloudflare</a>
  </div>
</body>
</html>
EOF

#########################################################
# 7) Country Challenge
#########################################################
cat > country-challenge.html << EOF
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=Edge">
  <meta name="robots" content="noindex, nofollow">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Country Challenge | rentforevent.com</title>

  ${GTM_HEAD}

  <style>
    body { margin:0;font-family:Arial,sans-serif;text-align:center;padding:60px 20px; color:#333; }
    .logo img { max-width:250px; margin-bottom:30px; }
    h1 { font-weight:300; font-size:2.5rem; margin-bottom:0.5em; }
    h2 { font-weight:300; font-size:1.6rem; color:#555; margin-bottom:1em; }
    p { line-height:1.5em; margin:0.8em 0; }
    .challenge-box { margin:2em 0; }
    .footer { margin-top:2em; font-size:0.85rem; color:#999; }
    .footer a { color:#999; text-decoration:none; }
  </style>
</head>
<body>
  ${GTM_BODY}

  <script>
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': 'Country_Challenge_RFE',
    'rayId': '::RAY_ID::'
  });
  </script>

  <div class="logo">
    <img src="https://storage.googleapis.com/cloudflarerrror-rent/logo-rent.svg" alt="RentForEvent Logo">
  </div>

  <h1>Country Challenge</h1>
  <h2>Your location has been flagged</h2>
  <p>
    This site blocks certain countries from direct access. If you think this is an error,
    complete the challenge or contact rentforevent.com for assistance.
  </p>

  <div class="challenge-box">
    ::CAPTCHA_BOX::
  </div>

  <div class="footer">
    Cloudflare Ray ID: <strong>::RAY_ID::</strong> &bull;
    Your IP: <strong>::CLIENT_IP::</strong> &bull;
    Powered by <a href="https://www.cloudflare.com/" target="_blank" rel="noopener noreferrer">
      Cloudflare
    </a>
  </div>
</body>
</html>
EOF

#########################################################
# 8) JavaScript Challenge (Uses ::IM_UNDER_ATTACK_BOX::)
#########################################################
cat > javascript-challenge.html << EOF
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex, nofollow">
  <meta http-equiv="X-UA-Compatible" content="IE=Edge">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>JavaScript Challenge | rentforevent.com</title>

  ${GTM_HEAD}

  <style>
    body {margin:0;font-family:Arial,sans-serif;text-align:center;padding:60px 20px;color:#333;}
    .logo img {max-width:250px;margin-bottom:30px;}
    h1 {font-weight:300;font-size:2.5rem;margin-bottom:0.5em;}
    h2 {font-weight:300;font-size:1.6rem;color:#555;margin-bottom:1em;}
    p {line-height:1.5em;margin:0.8em 0;}
    .challenge-box {margin:2em 0;}
    .footer {margin-top:2em;font-size:0.85rem;color:#999;}
    .footer a {color:#999;text-decoration:none;}
  </style>
</head>
<body>
  ${GTM_BODY}

  <script>
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': 'JavaScript_Challenge_RFE',
    'rayId': '::RAY_ID::'
  });
  </script>

  <div class="logo">
    <img src="https://storage.googleapis.com/cloudflarerrror-rent/logo-rent.svg" alt="RentForEvent Logo">
  </div>

  <h1>JavaScript Challenge</h1>
  <h2>Validating your browser...</h2>
  <p>
    This site uses a brief JavaScript check to confirm you’re not a bot.
    You’ll be redirected once the test completes.
  </p>

  <div class="challenge-box">
    ::IM_UNDER_ATTACK_BOX::
  </div>

  <div class="footer">
    Cloudflare Ray ID: <strong>::RAY_ID::</strong> &bull;
    Your IP: <strong>::CLIENT_IP::</strong> &bull;
    Powered by <a href="https://www.cloudflare.com/" target="_blank" rel="noopener noreferrer">
      Cloudflare
    </a>
  </div>
</body>
</html>
EOF

#########################################################
# 9) 429 errors
#########################################################
cat > 429-errors.html << EOF
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex, nofollow">
  <meta http-equiv="X-UA-Compatible" content="IE=Edge">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Error 1015: Rate Limited | rentforevent.com</title>

  ${GTM_HEAD}

  <style>
    body {margin:0;font-family:Arial,sans-serif;text-align:center;padding:40px 20px;color:#333;}
    .logo img {max-width:250px;margin-bottom:30px;}
    h1 {font-weight:300;font-size:2.5rem;margin-bottom:0.3em;}
    h2 {font-weight:300;font-size:1.6rem;color:#555;margin-bottom:1em;}
    p {line-height:1.5em;margin:0.8em 0;}
    .footer {margin-top:2em;font-size:0.85rem;color:#999;}
    .footer a {color:#999;text-decoration:none;}
  </style>
</head>
<body>
  ${GTM_BODY}

  <script>
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': '429_RateLimited_RFE',
    'rayId': '::RAY_ID::'
  });
  </script>

  <div class="logo">
    <img src="https://storage.googleapis.com/cloudflarerrror-rent/logo-rent.svg" alt="RentForEvent Logo">
  </div>

  <h1>Error 1015</h1>
  <h2>You are being rate limited</h2>
  <p>
    Too many requests have been sent from your IP address in a short time.
    Please wait and try again later.
  </p>
  <p>
    If you believe this block is an error, contact <strong>rentforevent.com</strong>.
  </p>

  <div class="footer">
    Cloudflare Ray ID: <strong>::RAY_ID::</strong> &bull;
    Your IP: <strong>::CLIENT_IP::</strong> &bull;
    Powered by
    <a href="https://www.cloudflare.com/" target="_blank" rel="noopener noreferrer">
      Cloudflare
    </a>
  </div>
</body>
</html>
EOF

echo "All 9 Cloudflare custom pages for rentforevent.com have been created in:"
echo "cloudflare-custom-pages/"

exit 0
