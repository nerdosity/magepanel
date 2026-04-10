<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="referrer" content="no-referrer">
    <title>Deploy Panel — Login</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 16px;
            font-weight: 300;
            letter-spacing: -0.01em;
            background: rgb(35, 41, 53);
            color: rgb(236, 237, 239);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
        }

        /* MagePanel .AppViewNewVersion card style */
        .login-box {
            background: rgb(30, 34, 43);
            border-radius: 8px;
            padding: 40px 44px;
            width: 380px;
            box-shadow:
                rgba(0,0,0,.14) 0px 0px 11px 8px,
                rgba(0,0,0,.28) 2px 3px 12px 4px;
        }

        .login-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 28px;
        }

        /* MagePanel circular logo mark */
        .login-logo-mark {
            width: 36px;
            height: 36px;
            background: rgb(0, 209, 202);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.9rem;
            color: rgb(24, 27, 34);
            flex-shrink: 0;
        }

        .login-logo-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: rgb(236, 237, 239);
            letter-spacing: -0.3px;
        }

        .login-logo-title em {
            color: rgb(0, 209, 202);
            font-style: normal;
        }

        .login-sub {
            font-size: 0.85rem;
            color: rgb(128, 140, 169);
            margin-bottom: 28px;
            line-height: 1.5;
        }

        /* MagePanel .InputLabel */
        label {
            display: block;
            font-size: 14px;
            color: rgb(128, 140, 169);
            margin-bottom: 4px;
        }

        /* MagePanel .InputContent style */
        input[type="password"] {
            width: 100%;
            height: 42px;
            padding: 10px 16px;
            background: rgb(35, 41, 53);
            border: 1px solid rgb(35, 41, 53);
            border-bottom-color: rgb(255, 255, 255);
            border-radius: 2px;
            color: rgba(255, 255, 255, 0.8);
            font-family: inherit;
            font-size: 16px;
            font-weight: 300;
            margin-bottom: 20px;
            outline: none;
            transition: box-shadow 0.15s;
        }

        input[type="password"]:focus {
            box-shadow: rgb(28, 168, 184) 0px 0px 0px 1px;
        }

        input[type="password"]::placeholder {
            color: rgba(255,255,255,.3);
            font-style: italic;
        }

        /* MagePanel .Button.green.solid */
        button[type="submit"] {
            width: 100%;
            min-height: 46px;
            padding: 0 18px;
            background: rgb(0, 209, 202);
            border: 2px solid transparent;
            border-radius: 3px;
            color: rgb(24, 27, 34);
            font-family: inherit;
            font-size: 16px;
            font-weight: 700;
            letter-spacing: -0.3px;
            cursor: pointer;
            transition: background 0.18s;
        }

        button[type="submit"]:hover { background: rgb(28, 168, 184); }
        button[type="submit"]:active { background: rgb(48, 140, 171); }
    </style>
</head>
<body>
    <div class="login-box">
        <div class="login-logo">
            <div class="login-logo-mark">N</div>
            <span class="login-logo-title">Deploy<em>Panel</em></span>
        </div>
        <p class="login-sub">Inserisci il token di accesso per continuare.</p>
        <form method="post" action="">
            <label for="token">Token di accesso</label>
            <input type="password" id="token" name="token"
                   autofocus autocomplete="current-password"
                   placeholder="••••••••">
            <button type="submit">Accedi</button>
        </form>
    </div>
</body>
</html>
