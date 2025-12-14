# Google OAuth Setup Guide for GlowCheck

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API:
   - Navigate to **APIs & Services** → **Library**
   - Search for "Google+ API" and click **Enable**
4. Create OAuth 2.0 Credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - If prompted, configure the OAuth consent screen first
   - Application type: **Web application**
   - Name: `GlowCheck Web Client`
   - Authorized redirect URIs: Add your Supabase callback URL:
     ```
     https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback
     ```
   - Click **Create**
   - **Copy the Client ID and Client Secret** (you'll need these)

## Step 2: Configure OAuth Consent Screen (if not done)

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace)
3. Fill in:
   - App name: `GlowCheck`
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes (if needed):
   - `email`
   - `profile`
   - `openid`
5. Save and continue

## Step 3: Fill in Supabase Google Provider Settings

1. In Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Enable the toggle: **Enable Sign in with Google** → ON
3. **Client IDs**: Paste your Google OAuth Client ID
4. **Client Secret (for OAuth)**: Paste your Google OAuth Client Secret
5. **Skip nonce checks**: Leave OFF (default)
6. **Allow users without an email**: Leave OFF (default)
7. **Callback URL**: Already filled by Supabase (use this in Google Cloud Console)
8. **Redirect URLs** (for mobile apps): Add your app's deep link URL:
   - For this app: `glowcheck:///`
   - This allows the OAuth callback to redirect back to your mobile app
9. Click **Save**

## Step 4: Configure Mobile App Redirect URL

1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your app's redirect URL to the **Redirect URLs** list:
   - `glowcheck:///` (your app's deep link scheme)
3. This allows Supabase to redirect OAuth callbacks back to your mobile app

## Step 5: Test

1. Try signing in with Google in your app (both signup and login screens have Google buttons)
2. You should be redirected to Google's sign-in page in a browser
3. After authentication, you'll be redirected back to your app
4. The app should automatically sign you in

## Troubleshooting

- **"redirect_uri_mismatch"**: Make sure the callback URL in Google Cloud Console exactly matches the one in Supabase
- **"invalid_client"**: Double-check your Client ID and Client Secret
- **"access_denied"**: Check your OAuth consent screen configuration

## For Mobile Apps (Future)

If you want to add native mobile Google Sign-In:
1. Create additional OAuth clients in Google Cloud Console:
   - iOS client (for Apple devices)
   - Android client (for Android devices)
2. Add those Client IDs to the Supabase Client IDs field (comma-separated)

